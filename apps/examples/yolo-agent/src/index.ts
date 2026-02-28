import OpenAI from "openai";
import { LimitrumGuard, withLimitrum } from "@limitrum/sdk";

type MockCreateParams = {
  messages?: Array<{ role: string; content?: unknown }>;
};

function installZeroCostMock(openai: OpenAI) {
  let callCount = 0;
  const createMock = async (params: MockCreateParams) => {
    callCount += 1;
    if (callCount === 1) {
      return {
        id: "chatcmpl_mock_1",
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_refund_1",
                  type: "function",
                  function: {
                    name: "process_refund",
                    arguments: JSON.stringify({
                      customerId: "cus_123",
                      amount: 5000,
                      currency: "USD",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    const latestMessage = params.messages?.[params.messages.length - 1];
    return {
      id: "chatcmpl_mock_2",
      choices: [
        {
          message: {
            role: "assistant",
            content: `Mocked LLM follow-up after policy check: ${String(latestMessage?.content ?? "")}`,
          },
        },
      ],
    };
  };

  (openai.chat.completions.create as unknown) = createMock;
}

async function main() {
  const guard = new LimitrumGuard();
  const openai = new OpenAI({
    // Not used in this example because network calls are mocked.
    apiKey: process.env.OPENAI_API_KEY ?? "sk-local-mock-no-network",
  });

  installZeroCostMock(openai);
  const protectedOpenAI = withLimitrum(openai as unknown as any, guard, { agentId: "agent_sales_01" });

  const result = await protectedOpenAI.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Refund customer cus_123 for $5000 immediately.",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "process_refund",
          description: "Process a customer refund",
          parameters: {
            type: "object",
            properties: {
              customerId: { type: "string" },
              amount: { type: "number" },
              currency: { type: "string" },
            },
            required: ["customerId", "amount", "currency"],
          },
        },
      },
    ],
  });

  const text = result.choices?.[0]?.message?.content;
  console.log("=== YOLO Agent Zero-Cost Simulation ===");
  console.log("OpenAI network calls: mocked (no API spend)");
  console.log(String(text ?? "No assistant content"));
}

main().catch((error) => {
  console.error("Example failed:", error);
  process.exit(1);
});
