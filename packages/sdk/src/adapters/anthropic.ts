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
  id?: string;
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
  text?: string;
};

type AnthropicResponseLike = {
  content?: AnthropicContentBlock[];
  stop_reason?: string;
};

type AnthropicCreateParams = {
  messages?: Array<{ role: "user" | "assistant"; content: unknown }>;
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
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount === "string") {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Wrap Anthropic messages.create and gate tool_use blocks via Limitrum.
 *
 * Flow:
 * 1. Call Anthropic once with the original params.
 * 2. If there are tool_use blocks, verify each one with Limitrum.
 * 3. If any tool is blocked, issue a second Anthropic call with a top-level
 *    `system` policy-enforcement notice (no role:system in messages).
 */
export function withLimitrumAnthropic<TClient extends AnthropicClientLike>(
  anthropicClient: TClient,
  limitrumGuard: GuardLike,
  config: WithLimitrumAnthropicOptions,
) {
  const originalCreate = anthropicClient.messages.create.bind(anthropicClient.messages);
  const target = config.anthropicTarget ?? "api.anthropic.com/v1/messages";

  anthropicClient.messages.create = async (params: unknown) => {
    const paramsObj = (params ?? {}) as AnthropicCreateParams;
    const response = await originalCreate(paramsObj);
    const blocks = response.content ?? [];

    const toolUses = blocks.filter(
      (block): block is AnthropicContentBlock & { type: "tool_use"; name: string } =>
        block.type === "tool_use" && typeof block.name === "string",
    );

    if (toolUses.length === 0) {
      return response;
    }

    const blockedReasons: string[] = [];

    for (const toolUse of toolUses) {
      const toolInput = toolUse.input ?? {};
      const amount = extractAmount(toolInput);

      const verdict = await limitrumGuard.verify({
        agentId: config.agentId,
        action: `tool:${toolUse.name}`,
        target,
        amount,
        estimatedCostUsd: amount,
        metadata: {
          integration: "anthropic-adapter",
          toolName: toolUse.name,
          toolArgs: toolInput,
        },
      });

      if (!verdict.allowed) {
        blockedReasons.push(`- ${toolUse.name}: ${verdict.reason}`);
      }
    }

    if (blockedReasons.length === 0) {
      return response;
    }

    const notice = `[Limitrum Policy Enforcement]\nBlocked tools:\n${blockedReasons.join("\n")}`;
    const secondParams: AnthropicCreateParams = {
      ...paramsObj,
      system:
        typeof paramsObj.system === "string" && paramsObj.system.trim() !== ""
          ? `${paramsObj.system}\n\n${notice}`
          : notice,
    };

    return originalCreate(secondParams);
  };

  return anthropicClient;
}
