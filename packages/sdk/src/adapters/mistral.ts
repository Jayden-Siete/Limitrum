type ToolCall = {
  function?: {
    name?: string;
    arguments?: string | Record<string, unknown>;
  };
};

type MistralMessage = {
  role?: string;
  content?: unknown;
  tool_calls?: ToolCall[];
  toolCalls?: ToolCall[];
};

type MistralResponseLike = {
  choices?: Array<{
    message?: MistralMessage;
  }>;
};

type MistralChatLike = {
  chat: {
    complete: (params: unknown) => Promise<MistralResponseLike>;
  };
};

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

type WithLimitrumMistralOptions = {
  agentId: string;
  mistralTarget?: string;
};

function safeToolArgs(raw: string | Record<string, unknown> | undefined) {
  if (!raw) {
    return {};
  }
  if (typeof raw === "object") {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function extractAmount(toolArgs: Record<string, unknown>) {
  const amount = toolArgs.amount;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return amount;
  }
  if (typeof amount === "string") {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractTarget(toolArgs: Record<string, unknown>, fallbackTarget: string) {
  for (const key of ["target", "url", "endpoint", "domain", "host", "apiUrl"]) {
    const value = toolArgs[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return fallbackTarget;
}

function getToolCalls(message: MistralMessage | undefined) {
  return message?.tool_calls ?? message?.toolCalls ?? [];
}

/**
 * Wrap Mistral chat.complete so function calls are policy-checked before execution.
 */
export function withLimitrumMistral<TClient extends MistralChatLike>(
  mistralClient: TClient,
  limitrumGuard: GuardLike,
  options: WithLimitrumMistralOptions,
) {
  const originalComplete = mistralClient.chat.complete.bind(mistralClient.chat);
  const defaultTarget = options.mistralTarget ?? "api.mistral.ai/v1/chat/completions";

  mistralClient.chat.complete = async (params: unknown) => {
    const firstResponse = await originalComplete(params);
    const toolCalls = getToolCalls(firstResponse.choices?.[0]?.message);
    if (toolCalls.length === 0) {
      return firstResponse;
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function?.name ?? "unknown_tool";
      const toolArgs = safeToolArgs(toolCall.function?.arguments);
      const amount = extractAmount(toolArgs);
      const target = extractTarget(toolArgs, defaultTarget);

      const verdict = await limitrumGuard.verify({
        agentId: options.agentId,
        action: `tool:${toolName}`,
        target,
        amount,
        estimatedCostUsd: amount,
        metadata: {
          integration: "mistral-adapter",
          toolName,
          toolArgs,
        },
      });

      if (!verdict.allowed) {
        const paramsObj = (params ?? {}) as { messages?: unknown };
        const previousMessages = Array.isArray(paramsObj.messages) ? (paramsObj.messages as MistralMessage[]) : [];
        const policyMessage: MistralMessage = {
          role: "system",
          content: `Limitrum Policy Enforcement: Action blocked because ${verdict.reason}`,
        };

        return originalComplete({
          ...(paramsObj as Record<string, unknown>),
          messages: [...previousMessages, policyMessage],
        });
      }
    }

    return firstResponse;
  };

  return mistralClient;
}
