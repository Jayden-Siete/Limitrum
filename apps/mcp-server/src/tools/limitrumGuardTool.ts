import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();

type LimitrumGuardToolInput = {
  agentId: string;
  action: string;
  target: string;
  amount?: number;
  estimatedCostUsd?: number;
  metadata?: Record<string, unknown>;
};

export const limitrumGuardTool = {
  name: "limitrum_guard",
  description: "Evaluate agent intent with deterministic Limitrum policy checks.",
  inputSchema: {
    type: "object",
    properties: {
      agentId: { type: "string", description: "Agent identifier" },
      action: { type: "string", description: "Action identifier or tool name" },
      target: { type: "string", description: "Target endpoint/resource" },
      amount: { type: "number", description: "Transaction amount to evaluate" },
      estimatedCostUsd: { type: "number", description: "Estimated action cost in USD" },
      metadata: {
        type: "object",
        description: "Optional metadata forwarded to policy evaluation",
      },
    },
    required: ["agentId", "action", "target"],
    additionalProperties: true,
  },
};

export async function runLimitrumGuardTool(rawArgs: unknown) {
  const args = (rawArgs ?? {}) as Partial<LimitrumGuardToolInput>;
  const input: LimitrumGuardToolInput = {
    agentId: String(args.agentId ?? ""),
    action: String(args.action ?? ""),
    target: String(args.target ?? ""),
    amount: typeof args.amount === "number" ? args.amount : undefined,
    estimatedCostUsd: typeof args.estimatedCostUsd === "number" ? args.estimatedCostUsd : undefined,
    metadata: args.metadata && typeof args.metadata === "object" ? args.metadata : undefined,
  };

  const verdict = await guard.verify(input);
  return {
    tool: "limitrum_guard",
    input,
    ...verdict,
    enforcedBy: "limitrum-policy-kernel",
    timestamp: new Date().toISOString(),
  };
}
