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
  stop_reason?: string;
};

type AnthropicMessageParam = {
  role: "user" | "assistant";
  content: unknown;
};

type AnthropicCreateParams = {
  messages?: AnthropicMessageParam[];
  system?: string;
  model?: string;
  max_tokens?: number;
  [key: string]: unknown;
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
 *
 * Fix: Anthropic does NOT support role:"system" inside the messages array.
 * The system prompt must be passed as a top-level `system` string parameter.
 * When a tool call is blocked, we inject the enforcement notice into the
 * top-level `system` field and re-call the model so it can respond accordingly.
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
        const paramsObj = (params ?? {}) as AnthropicCreateParams;

        // Build the enforcement notice to prepend to the system prompt.
        const enforcementNotice = `[Limitrum Policy Enforcement] Action '${toolName}' was blocked: ${verdict.reason}. Do not attempt this action again.`;

        // Anthropic requires system to be a top-level string, not a message role.
        const existingSystem = typeof paramsObj.system === "string" ? paramsObj.system : "";
        const updatedSystem = existingSystem
          ? `${existingSystem}\n\n${enforcementNotice}`
          : enforcementNotice;

        return originalCreate({
          ...paramsObj,
          system: updatedSystem,
        });
      }
    }

    return firstResponse;
  };

  return anthropicClient;
}
