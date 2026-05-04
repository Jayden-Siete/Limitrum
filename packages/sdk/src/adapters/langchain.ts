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

type ToolLike<TInput = unknown, TOutput = unknown> = {
  name: string;
  description?: string;
  invoke?: (input: TInput) => Promise<TOutput>;
  call?: (input: TInput) => Promise<TOutput>;
};

type WithLimitrumToolOptions = {
  agentId: string;
  target?: string;
};

function extractAmount(input: unknown) {
  if (!input || typeof input !== "object") {
    return 0;
  }
  const maybeAmount = (input as Record<string, unknown>).amount;
  if (typeof maybeAmount === "number" && Number.isFinite(maybeAmount)) {
    return maybeAmount;
  }
  if (typeof maybeAmount === "string") {
    const parsed = Number(maybeAmount);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractTarget(input: unknown, fallbackTarget: string) {
  if (!input || typeof input !== "object") {
    return fallbackTarget;
  }
  const inputObj = input as Record<string, unknown>;
  for (const key of ["target", "url", "endpoint", "domain", "host", "apiUrl"]) {
    const value = inputObj[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return fallbackTarget;
}

function getExecutor<TInput, TOutput>(tool: ToolLike<TInput, TOutput>) {
  if (typeof tool.invoke === "function") {
    return { kind: "invoke" as const, fn: tool.invoke.bind(tool) };
  }
  if (typeof tool.call === "function") {
    return { kind: "call" as const, fn: tool.call.bind(tool) };
  }
  throw new Error(`Tool '${tool.name}' must expose invoke() or call().`);
}

/**
 * Wrap a single LangChain tool with Limitrum policy enforcement.
 */
export function withLimitrumTool<TInput = unknown, TOutput = unknown>(
  tool: ToolLike<TInput, TOutput>,
  guard: GuardLike,
  options: WithLimitrumToolOptions,
): ToolLike<TInput, TOutput | string> {
  const { kind, fn } = getExecutor(tool);
  const target = options.target ?? "langchain/tool-execution";

  const wrappedExecutor = async (input: TInput) => {
    const amount = extractAmount(input);
    const toolTarget = extractTarget(input, target);
    const verdict = await guard.verify({
      agentId: options.agentId,
      action: `tool:${tool.name}`,
      target: toolTarget,
      amount,
      estimatedCostUsd: amount,
      metadata: {
        integration: "langchain-adapter",
        toolName: tool.name,
        toolInput: input as unknown,
      },
    });

    if (!verdict.allowed) {
      return `Limitrum Policy Enforcement: Action blocked because ${verdict.reason}`;
    }

    return fn(input);
  };

  if (kind === "invoke") {
    return {
      ...tool,
      invoke: wrappedExecutor,
    };
  }

  return {
    ...tool,
    call: wrappedExecutor,
  };
}

/**
 * Wrap an entire toolkit (array of tools) in one pass for better DX.
 */
export function withLimitrumToolkit<TInput = unknown, TOutput = unknown>(
  toolkit: Array<ToolLike<TInput, TOutput>>,
  guard: GuardLike,
  options: WithLimitrumToolOptions,
) {
  return toolkit.map((tool) => withLimitrumTool(tool, guard, options));
}
