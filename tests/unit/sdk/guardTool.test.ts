import { describe, expect, it, vi } from "vitest";
import { guardTool, LimitrumToolBlockedError } from "@limitrum/sdk";

function makeGuard(allowed: boolean, reason = "ok") {
  return {
    verify: vi.fn().mockResolvedValue({
      allowed,
      decision: allowed ? "allowed" : "blocked",
      reason,
      guardTriggered: allowed ? undefined : "domain-allowlist",
      cumulativeSpent: 0,
      remainingBudget: 50,
      latencyMs: 1,
    }),
  };
}

describe("guardTool", () => {
  it("verifies the intent before executing the tool", async () => {
    const guard = makeGuard(true);
    const execute = vi.fn().mockResolvedValue({ chargeId: "ch_safe" });
    const protectedCharge = guardTool(guard, {
      agentId: "agent_billing",
      toolName: "stripe.createCharge",
      target: "api.stripe.com/v1/charges",
      amount: (ctx: { input: { amount: number } }) => ctx.input.amount,
      execute,
    });

    const result = await protectedCharge({ amount: 25 });

    expect(guard.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "agent_billing",
        action: "tool:stripe.createCharge",
        target: "api.stripe.com/v1/charges",
        amount: 25,
      }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.executed).toBe(true);
  });

  it("does not execute the tool when Limitrum blocks", async () => {
    const guard = makeGuard(false, "Domain is not in the allowlist.");
    const execute = vi.fn();
    const protectedFetch = guardTool(guard, {
      agentId: "agent_research",
      toolName: "fetch",
      target: (ctx: { input: { url: string } }) => ctx.input.url,
      execute,
    });

    const result = await protectedFetch({ url: "api.unknown-exfil.io/export" });

    expect(execute).not.toHaveBeenCalled();
    expect(result.executed).toBe(false);
    expect(result.verdict.reason).toContain("allowlist");
  });

  it("can throw a typed error when configured for exception-based flows", async () => {
    const guard = makeGuard(false, "Action blocked.");
    const protectedShell = guardTool(guard, {
      agentId: "agent_coder",
      toolName: "shell.exec",
      target: "local.process",
      onBlock: "throw",
      execute: vi.fn(),
    });

    await expect(protectedShell({ command: "rm -rf /prod" })).rejects.toBeInstanceOf(
      LimitrumToolBlockedError,
    );
  });
});
