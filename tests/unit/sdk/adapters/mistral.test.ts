import { describe, it, expect, vi, beforeEach } from "vitest";
import { withLimitrumMistral } from "@limitrum/sdk";

function makeGuard(allowed: boolean, reason = "test reason") {
  return {
    verify: vi.fn().mockResolvedValue({
      allowed,
      decision: allowed ? "allowed" : "blocked",
      reason,
    }),
  };
}

function makeMistralClient(toolCalls: unknown[] = [], content = "Hello!") {
  const completeMock = vi.fn().mockResolvedValue({
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
      complete: completeMock,
    },
    _completeMock: completeMock,
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

describe("withLimitrumMistral (Mistral adapter)", () => {
  const options = { agentId: "agent_test_mistral_01" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns original response when no tool calls are present", async () => {
    const client = makeMistralClient([]);
    const guard = makeGuard(true);
    const wrapped = withLimitrumMistral(client, guard, options);

    const result = await wrapped.chat.complete({ model: "mistral-large-latest", messages: [] });
    expect(result.choices?.[0]?.message?.content).toBe("Hello!");
    expect(guard.verify).not.toHaveBeenCalled();
  });

  it("checks each Mistral tool call with Limitrum", async () => {
    const client = makeMistralClient([makeToolCall("process_refund", { amount: 250 })]);
    const guard = makeGuard(true);
    const wrapped = withLimitrumMistral(client, guard, options);

    await wrapped.chat.complete({ model: "mistral-large-latest", messages: [] });
    expect(guard.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "agent_test_mistral_01",
        action: "tool:process_refund",
        amount: 250,
      }),
    );
  });

  it("uses target from tool arguments when provided", async () => {
    const client = makeMistralClient([makeToolCall("fetch_url", { target: "api.unknown-exfil.io/export" })]);
    const guard = makeGuard(true);
    const wrapped = withLimitrumMistral(client, guard, options);

    await wrapped.chat.complete({ model: "mistral-large-latest", messages: [] });
    expect(guard.verify).toHaveBeenCalledWith(
      expect.objectContaining({ target: "api.unknown-exfil.io/export" }),
    );
  });

  it("calls Mistral again with a policy message when blocked", async () => {
    const client = makeMistralClient([makeToolCall("process_refund", { amount: 250 })]);
    const guard = makeGuard(false, "Per-action cap exceeded.");
    const wrapped = withLimitrumMistral(client, guard, options);

    await wrapped.chat.complete({ model: "mistral-large-latest", messages: [{ role: "user", content: "refund" }] });
    expect(client._completeMock).toHaveBeenCalledTimes(2);

    const secondCall = client._completeMock.mock.calls[1][0] as { messages: Array<{ role: string; content: string }> };
    expect(secondCall.messages.at(-1)?.role).toBe("system");
    expect(secondCall.messages.at(-1)?.content).toContain("Per-action cap exceeded.");
  });
});
