import { describe, it, expect, vi, beforeEach } from "vitest";
import { withLimitrum } from "@limitrum/sdk";

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

// ── Mock OpenAI client factory ────────────────────────────────────────────────

function makeOpenAIClient(toolCalls: unknown[] = [], content = "Hello!") {
  const createMock = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content,
          tool_calls: toolCalls,
        },
      },
    ],
  });

  return {
    chat: {
      completions: {
        create: createMock,
      },
    },
    _createMock: createMock,
  };
}

function makeToolCall(name: string, args: Record<string, unknown> = {}) {
  return {
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("withLimitrum (OpenAI adapter)", () => {
  const options = { agentId: "agent_test_01" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── No tool calls ───────────────────────────────────────────────────────────

  describe("no tool calls in response", () => {
    it("returns original response when no tool calls present", async () => {
      const client = makeOpenAIClient([]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      const result = await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(result.choices?.[0]?.message?.content).toBe("Hello!");
      expect(guard.verify).not.toHaveBeenCalled();
    });

    it("does not call guard when response has no tool_calls array", async () => {
      const client = makeOpenAIClient(undefined as unknown as unknown[]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).not.toHaveBeenCalled();
    });
  });

  // ── Tool calls allowed ──────────────────────────────────────────────────────

  describe("tool calls — allowed", () => {
    it("calls guard.verify for each tool call", async () => {
      const toolCalls = [makeToolCall("send_email"), makeToolCall("search_web")];
      const client = makeOpenAIClient(toolCalls);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).toHaveBeenCalledTimes(2);
    });

    it("passes correct agentId to guard.verify", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ agentId: "agent_test_01" }),
      );
    });

    it("passes tool name as action with tool: prefix", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ action: "tool:send_email" }),
      );
    });

    it("extracts amount from tool arguments", async () => {
      const client = makeOpenAIClient([makeToolCall("transfer_funds", { amount: 42.5 })]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 42.5 }),
      );
    });

    it("returns original response when all tool calls are allowed", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, options);

      const result = await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(result.choices?.[0]?.message?.content).toBe("Hello!");
    });
  });

  // ── Tool calls blocked ──────────────────────────────────────────────────────

  describe("tool calls — blocked", () => {
    it("calls create again with injected system message when blocked", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(false, "Domain not allowlisted.");
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: "hi" }] });
      expect(client._createMock).toHaveBeenCalledTimes(2);
    });

    it("injected system message contains block reason", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(false, "Budget exceeded.");
      const wrapped = withLimitrum(client, guard, options);

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      const secondCall = client._createMock.mock.calls[1][0] as { messages: Array<{ role: string; content: string }> };
      const systemMsg = secondCall.messages.find((m) => m.role === "system");
      expect(systemMsg?.content).toContain("Budget exceeded.");
    });
  });

  // ── Custom target ───────────────────────────────────────────────────────────

  describe("custom openAiTarget", () => {
    it("uses custom target when provided", async () => {
      const client = makeOpenAIClient([makeToolCall("send_email")]);
      const guard = makeGuard(true);
      const wrapped = withLimitrum(client, guard, {
        agentId: "agent_test_01",
        openAiTarget: "custom.proxy.com/v1",
      });

      await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
      expect(guard.verify).toHaveBeenCalledWith(
        expect.objectContaining({ target: "custom.proxy.com/v1" }),
      );
    });
  });
});
