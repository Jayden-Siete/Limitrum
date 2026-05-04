import { randomUUID } from "node:crypto";
import { agents, bootstrapSchema, db, organizations, policies } from "@limitrum/db";
import { LimitrumGuard, withLimitrumMistral } from "@limitrum/sdk";

const organizationId = "org_limitrum_mistral_example";
const agentId = `agent_mistral_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

type MistralParams = {
  messages?: Array<{ role: string; content?: unknown }>;
};

function makeMockMistralClient() {
  let callCount = 0;
  const calls: unknown[] = [];

  const complete = async (params: unknown) => {
    const paramsObj = (params ?? {}) as MistralParams;
    callCount += 1;
    calls.push(paramsObj);

    if (callCount === 1) {
      return {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_fetch_unknown",
                  type: "function",
                  function: {
                    name: "fetch_url",
                    arguments: JSON.stringify({
                      url: "api.unknown-exfil.io/customer-export",
                      amount: 1,
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    const policyMessage = paramsObj.messages?.at(-1)?.content;
    return {
      choices: [
        {
          message: {
            content: `Mistral follow-up after Limitrum block: ${String(policyMessage ?? "")}`,
          },
        },
      ],
    };
  };

  return {
    chat: { complete },
    calls,
  };
}

async function preparePolicy() {
  const now = Date.now();

  await bootstrapSchema();

  await db
    .insert(organizations)
    .values({
      id: organizationId,
      name: "Limitrum Mistral Example",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db.insert(agents).values({
    id: agentId,
    organizationId,
    name: "Mistral Tool Agent",
    environment: "development",
    status: "active",
    createdAt: now,
  });

  await db.insert(policies).values({
    id: `policy_${agentId}`,
    agentId,
    maxDailySpend: 50,
    perActionCap: 100,
    maxRatePerMinute: 60,
    allowedEndpoints: JSON.stringify(["api.stripe.com", "api.github.com", "api.mistral.ai"]),
    loopDetectionEnabled: 1,
    loopDetectionMaxCount: 5,
    loopDetectionWindowSec: 10,
    syscallProtectionEnabled: 1,
    destructiveActionsEnabled: 1,
    dataExfilEnabled: 1,
    promptInjectionEnabled: 1,
    blockedPatterns: "[]",
    createdAt: now,
    updatedAt: now,
  });
}

async function main() {
  await preparePolicy();

  const guard = new LimitrumGuard();
  const mistral = makeMockMistralClient();
  const protectedMistral = withLimitrumMistral(mistral, guard, { agentId });

  const result = await protectedMistral.chat.complete({
    model: "mistral-large-latest",
    messages: [{ role: "user", content: "Fetch the full customer export from the unknown vendor API." }],
    tools: [
      {
        type: "function",
        function: {
          name: "fetch_url",
          description: "Fetch data from a URL",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string" },
              amount: { type: "number" },
            },
            required: ["url"],
          },
        },
      },
    ],
  });

  console.log("=== Mistral Tool-Call Protection Simulation ===");
  console.log("Mistral network calls: mocked (no API spend)");
  console.log("First model response proposed: tool:fetch_url -> api.unknown-exfil.io/customer-export");
  console.log("Limitrum verdict: BLOCK guard=domain-allowlist");
  console.log(String(result.choices?.[0]?.message?.content ?? "No follow-up content"));
}

main().catch((error) => {
  console.error("Mistral example failed:", error);
  process.exit(1);
});
