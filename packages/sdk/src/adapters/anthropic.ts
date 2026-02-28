type GuardLike = {
  verify: (input: {
    agentId: string;
    action: string;
    target: string;
    amount?: number;
    estimatedCostUsd?: number;
    metadata?: Record<string, unknown>;
  }) => Promise<{
    allowed: boolean;
    decision: "allowed" | "blocked";
    reason: string;
  }>;
};

type AnthropicContentBlock = {
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
};

type AnthropicResponseLike = {
  content?: AnthropicContentBlock[];
};

type AnthropicClientLike = {
  messages: {
    create: (params: unknown) => Promise<AnthropicResponseLike>;
  };
};

type WithLimitrumAnthropicOptions = {
  agentId: string;
  anthropicTarget?: string;
};

function extractAmount(args: Record<string, unknown>) {
  const amount = args.amount;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return amount;
  }
  if (typeof amount === "string") {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Wrap Anthropic messages.create to gate tool_use blocks via Limitrum.
 */
export function withLimitrumAnthropic<TClient extends AnthropicClientLike>(
  anthropicClient: TClient,
  limitrumGuard: GuardLike,
  options: WithLimitrumAnthropicOptions,
) {
  const originalCreate = anthropicClient.messages.create.bind(anthropicClient.messages);
  const target = options.anthropicTarget ?? "api.anthropic.com/v1/messages";

  anthropicClient.messages.create = async (params: unknown) => {
    const firstResponse = await originalCreate(params);
    const toolUses = (firstResponse.content ?? []).filter((block) => block.type === "tool_use");
    if (toolUses.length === 0) {
      return firstResponse;
    }

    for (const toolUse of toolUses) {
      const toolName = toolUse.name ?? "unknown_tool";
      const toolInput = toolUse.input ?? {};
      const amount = extractAmount(toolInput);

      const verdict = await limitrumGuard.verify({
        agentId: options.agentId,
        action: `tool:${toolName}`,
        target,
        amount,
        estimatedCostUsd: amount,
        metadata: {
          integration: "anthropic-adapter",
          toolName,
          toolArgs: toolInput,
        },
      });

      if (!verdict.allowed) {
        const paramsObj = (params ?? {}) as {
          messages?: Array<{ role: string; content: unknown }>;
        };
        const previousMessages = Array.isArray(paramsObj.messages) ? paramsObj.messages : [];

        return originalCreate({
          ...(paramsObj as Record<string, unknown>),
          messages: [
            ...previousMessages,
            {
              role: "system",
              content: `Limitrum Policy Enforcement: Action blocked because ${verdict.reason}`,
            },
          ],
        });
      }
    }

    return firstResponse;
  };

  return anthropicClient;
}
