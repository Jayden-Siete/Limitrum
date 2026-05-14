import type { VerifyIntentInput, VerifyIntentResult } from "./LimitrumGuard.js";

export type GuardToolGuard = {
  verify: (input: VerifyIntentInput) => Promise<VerifyIntentResult>;
};

export type GuardToolContext<TInput> = {
  input: TInput;
  toolName: string;
};

export type GuardedToolBlockedResult = {
  executed: false;
  verdict: VerifyIntentResult;
};

export type GuardedToolAllowedResult<TOutput> = {
  executed: true;
  verdict: VerifyIntentResult;
  output: TOutput;
};

export type GuardedToolResult<TOutput> =
  | GuardedToolAllowedResult<TOutput>
  | GuardedToolBlockedResult;

export type GuardToolOptions<TInput, TOutput> = {
  agentId: string;
  toolName: string;
  target: string | ((context: GuardToolContext<TInput>) => string);
  amount?: number | ((context: GuardToolContext<TInput>) => number | undefined);
  estimatedCostUsd?: number | ((context: GuardToolContext<TInput>) => number | undefined);
  metadata?: Record<string, unknown> | ((context: GuardToolContext<TInput>) => Record<string, unknown>);
  onBlock?: "return" | "throw";
  action?: string | ((context: GuardToolContext<TInput>) => string);
  execute: (input: TInput, verdict: VerifyIntentResult) => Promise<TOutput> | TOutput;
};

function resolveValue<TInput, TValue>(
  value: TValue | ((context: GuardToolContext<TInput>) => TValue),
  context: GuardToolContext<TInput>,
): TValue {
  return typeof value === "function"
    ? (value as (context: GuardToolContext<TInput>) => TValue)(context)
    : value;
}

export class LimitrumToolBlockedError extends Error {
  public readonly verdict: VerifyIntentResult;

  constructor(verdict: VerifyIntentResult) {
    super(`Limitrum blocked tool execution: ${verdict.reason}`);
    this.name = "LimitrumToolBlockedError";
    this.verdict = verdict;
  }
}

/**
 * Wrap any sensitive tool so Limitrum verifies the intent before execution.
 *
 * This is the lowest-friction integration path for app-owned tools:
 * model proposes a tool call -> guardTool checks policy -> your function only
 * runs when the policy kernel returns ALLOW.
 */
export function guardTool<TInput, TOutput>(
  guard: GuardToolGuard,
  options: GuardToolOptions<TInput, TOutput>,
) {
  return async (input: TInput): Promise<GuardedToolResult<TOutput>> => {
    const context: GuardToolContext<TInput> = {
      input,
      toolName: options.toolName,
    };
    const amount = options.amount === undefined ? undefined : resolveValue(options.amount, context);
    const estimatedCostUsd =
      options.estimatedCostUsd === undefined
        ? amount
        : resolveValue(options.estimatedCostUsd, context);
    const metadata =
      options.metadata === undefined ? undefined : resolveValue(options.metadata, context);
    const action =
      options.action === undefined
        ? `tool:${options.toolName}`
        : resolveValue(options.action, context);

    const verdict = await guard.verify({
      agentId: options.agentId,
      action,
      target: resolveValue(options.target, context),
      amount,
      estimatedCostUsd,
      metadata: {
        integration: "guard-tool",
        toolName: options.toolName,
        input,
        ...(metadata ?? {}),
      },
    });

    if (!verdict.allowed) {
      if (options.onBlock === "throw") {
        throw new LimitrumToolBlockedError(verdict);
      }
      return { executed: false, verdict };
    }

    const output = await options.execute(input, verdict);
    return { executed: true, verdict, output };
  };
}
