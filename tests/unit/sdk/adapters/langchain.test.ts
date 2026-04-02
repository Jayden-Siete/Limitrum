import { describe, it, expect, vi, beforeEach } from "vitest";
import { withLimitrumTool, withLimitrumToolkit } from "@limitrum/sdk";

// ── Mock guard factory ────────────────────────────────────────────────────────

function makeGuard(allowed: boolean, reason = "test reason") {
  return {
    verify: vi.fn().mockResolvedValue({
      allowed,
      decision: allowed ? "allowed" : "blocked",
      reason,
    }),
  };
}

// ── Mock LangChain tool factory ───────────────────────────────────────────────

type ToolInput = Record<string, unknown>;

function makeTool(name: string, invokeResult: unknown = "tool result") {
  return {
    name,
    description: `Mock tool: ${name}`,
    invoke: vi.fn().mockResolvedValue(invokeResult),
    call: vi.fn().mockResolvedValue(invokeResult),
  };
}

// ── Tests: withLimitrumTool ───────────────────────────────────────────────────

describe("withLimitrumTool (LangChain single tool wrapper)", () => {
  const options = { agentId: "agent_test_lc_01" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("allowed actions", () => {
    it("calls guard.verify before invoking the tool", async () => {
      const tool = makeTool("search_web");
      const guard = makeGuard(true);
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapped as any).invoke({ query: "test" });
      expect(guard.verify).toHaveBeenCalledTimes(1);
    });

    it("passes agentId to guard.verify", async () => {
      const tool = makeTool("search_web");
      const guard = makeGuard(true);
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapped as any).invoke({ query: "test" });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent_test_lc_01" }),
      );
    });

    it("passes tool name as action with tool: prefix", async () => {
      const tool = makeTool("search_web");
      const guard = makeGuard(true);
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapped as any).invoke({ query: "test" });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ action: "tool:search_web" }),
      );
    });

    it("calls original tool.invoke when allowed", async () => {
      const tool = makeTool("search_web");
      const guard = makeGuard(true);
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (wrapped as any).invoke({ query: "test" });
      expect(tool.invoke).toHaveBeenCalledTimes(1);
      expect(result).toBe("tool result");
    });
  });

  describe("blocked actions", () => {
    it("does NOT call original tool.invoke when blocked", async () => {
      const tool = makeTool("delete_records");
      const guard = makeGuard(false, "Destructive action blocked.");
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapped as any).invoke({ table: "users" });
      expect(tool.invoke).not.toHaveBeenCalled();
    });

    it("returns block reason string when blocked", async () => {
      const tool = makeTool("delete_records");
      const guard = makeGuard(false, "Destructive action blocked.");
      const wrapped = withLimitrumTool(tool, guard, options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (wrapped as any).invoke({ table: "users" });
      expect(typeof result).toBe("string");
      expect(result as string).toContain("Destructive action blocked.");
    });
  });
});

// ── Tests: withLimitrumToolkit ────────────────────────────────────────────────

describe("withLimitrumToolkit (LangChain toolkit wrapper)", () => {
  const options = { agentId: "agent_test_lc_02" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wraps all tools in the toolkit", async () => {
    const tools = [makeTool("tool_a"), makeTool("tool_b"), makeTool("tool_c")];
    const guard = makeGuard(true);
    const wrapped = withLimitrumToolkit(tools, guard, options);

    expect(wrapped).toHaveLength(3);
  });

  it("each wrapped tool calls guard.verify independently", async () => {
    const tools = [makeTool("tool_a"), makeTool("tool_b")];
    const guard = makeGuard(true);
    const wrapped = withLimitrumToolkit(tools, guard, options);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wrapped[0] as any).invoke({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wrapped[1] as any).invoke({});

    expect(guard.verify).toHaveBeenCalledTimes(2);
  });

  it("blocked tool in toolkit does not invoke original", async () => {
    const tools = [makeTool("safe_tool"), makeTool("dangerous_tool")];
    const guard = makeGuard(false, "Blocked by policy.");
    const wrapped = withLimitrumToolkit(tools, guard, options);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wrapped[0] as any).invoke({});
    expect(tools[0]!.invoke).not.toHaveBeenCalled();
  });
});
