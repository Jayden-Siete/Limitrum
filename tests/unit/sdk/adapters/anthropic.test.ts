import { describe, it, expect, vi, beforeEach } from "vitest";
import { withLimitrumAnthropic } from "@limitrum/sdk";

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

// ── Mock Anthropic client factory ─────────────────────────────────────────────

type AnthropicMessage = {
  role: string;
  content: unknown;
};

type AnthropicParams = {
  messages?: AnthropicMessage[];
  system?: string;
  model?: string;
};

function makeAnthropicClient(toolUseBlocks: unknown[] = [], textContent = "Hello!") {
  const createMock = vi.fn().mockResolvedValue({
    content: [
      { type: "text", text: textContent },
      ...toolUseBlocks,
    ],
  });

  return {
    messages: {
      create: createMock,
    },
    _createMock: createMock,
  };
}

function makeToolUseBlock(name: string, input: Record<string, unknown> = {}) {
  return {
    type: "tool_use",
    id: `toolu_${Math.random().toString(36).slice(2)}`,
    name,
    input,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("withLimitrumAnthropic (Anthropic adapter)", () => {
  const options = { agentId: "agent_test_01" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── No tool use blocks ──────────────────────────────────────────────────────

  describe("no tool_use blocks in response", () => {
    it("returns original response when no tool_use blocks present", async () => {
      const client = makeAnthropicClient([]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      const result = await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(result.content[0]).toMatchObject({ type: "text", text: "Hello!" });
      expect(guard.verify).not.toHaveBeenCalled();
    });
  });

  // ── Tool use blocks allowed ─────────────────────────────────────────────────

  describe("tool_use blocks — allowed", () => {
    it("calls guard.verify for each tool_use block", async () => {
      const toolBlocks = [makeToolUseBlock("send_email"), makeToolUseBlock("search_web")];
      const client = makeAnthropicClient(toolBlocks);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(guard.verify).toHaveBeenCalledTimes(2);
    });

    it("passes correct agentId to guard.verify", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent_test_01" }),
      );
    });

    it("passes tool name as action with tool: prefix", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ action: "tool:send_email" }),
      );
    });

    it("uses tool target from input when provided", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("fetch_url", { url: "api.unknown-exfil.io/export" })]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-sonnet-4-5", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ target: "api.unknown-exfil.io/export" }),
      );
    });

    it("returns original response when all tool_use blocks are allowed", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, options);

      const result = await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(result.content[0]).toMatchObject({ type: "text", text: "Hello!" });
    });
  });

  // ── Tool use blocks blocked ─────────────────────────────────────────────────

  describe("tool_use blocks — blocked", () => {
    it("calls create again when a tool_use block is blocked", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(false, "Domain not allowlisted.");
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(client._createMock).toHaveBeenCalledTimes(2);
    });

    it("uses top-level system param (NOT messages[role:system]) when blocked", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(false, "Budget exceeded.");
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });

      const secondCallParams = client._createMock.mock.calls[1][0] as AnthropicParams;

      // CRITICAL: must use top-level system param, NOT messages[role:system]
      expect(secondCallParams.system).toBeDefined();
      expect(secondCallParams.system).toContain("Budget exceeded.");

      // Ensure no role:system injected into messages array
      const hasSystemInMessages = (secondCallParams.messages ?? []).some(
        (m) => m.role === "system",
      );
      expect(hasSystemInMessages).toBe(false);
    });

    it("block reason is included in top-level system param", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(false, "Daily budget exceeded. Remaining: $5.00.");
      const wrapped = withLimitrumAnthropic(client, guard, options);

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });

      const secondCallParams = client._createMock.mock.calls[1][0] as AnthropicParams;
      expect(secondCallParams.system).toContain("Daily budget exceeded");
    });
  });

  // ── Custom target ───────────────────────────────────────────────────────────

  describe("custom anthropicTarget", () => {
    it("uses custom target when provided", async () => {
      const client = makeAnthropicClient([makeToolUseBlock("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrumAnthropic(client, guard, {
        agentId: "agent_test_01",
        anthropicTarget: "custom.proxy.com/v1",
      });

      await wrapped.messages.create({ model: "claude-3-5-sonnet-20241022", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ target: "custom.proxy.com/v1" }),
      );
    });
  });
});
