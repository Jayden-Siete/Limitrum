type ToolCall = {
  function?: {
    name?: string;
    arguments?: string;
  };
};

type ChatMessage = {
  role: string;
  content?: unknown;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
      tool_calls?: ToolCall[];
    };
  }>;
};

type OpenAIChatLike = {
  chat: {
    completions: {
      create: (params: unknown) => Promise<ChatCompletionResponse>;
    };
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

type WithLimitrumOptions = {
  agentId: string;
  openAiTarget?: string;
};

function safeJsonParse(raw: string | undefined) {
  if (!raw) {
    return {};
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

/**
 * Wrap OpenAI chat.completions.create so tool calls are policy-checked before any execution path.
 */
export function withLimitrum<TClient extends OpenAIChatLike>(
  openaiClient: TClient,
  limitrumGuard: GuardLike,
  options: WithLimitrumOptions,
) {
  const originalCreate = openaiClient.chat.completions.create.bind(openaiClient.chat.completions);
  const target = options.openAiTarget ?? "api.openai.com/v1/chat/completions";

  openaiClient.chat.completions.create = async (params: unknown) => {
    const firstResponse = await originalCreate(params);
    const toolCalls = firstResponse.choices?.[0]?.message?.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return firstResponse;
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function?.name ?? "unknown_tool";
      const toolArgs = safeJsonParse(toolCall.function?.arguments);
      const amount = extractAmount(toolArgs);

      const verdict = await limitrumGuard.verify({
        agentId: options.agentId,
        action: `tool:${toolName}`,
        target,
        amount,
        estimatedCostUsd: amount,
        metadata: {
          integration: "openai-adapter",
          toolName,
          toolArgs,
        },
      });

      if (!verdict.allowed) {
        const injectedSystemMessage: ChatMessage = {
          role: "system",
          content: `Limitrum Policy Enforcement: Action blocked because ${verdict.reason}`,
        };
        const paramsObj = (params ?? {}) as { messages?: unknown };
        const previousMessages = Array.isArray(paramsObj.messages) ? (paramsObj.messages as ChatMessage[]) : [];

        return originalCreate({
          ...(paramsObj as Record<string, unknown>),
          messages: [...previousMessages, injectedSystemMessage],
        });
      }
    }

    return firstResponse;
  };

  return openaiClient;
}
