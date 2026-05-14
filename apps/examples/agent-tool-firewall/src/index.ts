import { randomUUID } from "node:crypto";
import { agents, bootstrapSchema, db, organizations, policies } from "@limitrum/db";
import {
  guardTool,
  LimitrumGuard,
  withLimitrum,
  withLimitrumAnthropic,
  withLimitrumMistral,
  withLimitrumTool,
  type VerifyIntentResult,
} from "@limitrum/sdk";

const organizationId = "org_limitrum_agent_firewall";
const agentId = `agent_firewall_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

type ChargeInput = {
  customerId: string;
  amount: number;
};

type FetchInput = {
  url: string;
};

type ShellInput = {
  command: string;
};

function printVerdict(label: string, verdict: VerifyIntentResult, executed: boolean) {
  const status = verdict.allowed ? "ALLOW" : "BLOCK";
  const guard = verdict.guardTriggered ? ` guard=${verdict.guardTriggered}` : "";
  const marker = executed ? "EXECUTED" : "NOT_EXECUTED";
  console.log(`${status.padEnd(5)} ${marker.padEnd(12)} ${label.padEnd(34)} ${guard}`);
  console.log(`      reason="${verdict.reason}"`);
}

async function preparePolicy() {
  const now = Date.now();
  await bootstrapSchema();

  await db
    .insert(organizations)
    .values({
      id: organizationId,
      name: "Limitrum Agent Firewall Demo",
      createdAt: now,
    })
    .onConflictDoNothing();

  await db.insert(agents).values({
    id: agentId,
    organizationId,
    name: "Agent Tool Firewall Demo",
    environment: "development",
    status: "active",
    createdAt: now,
  });

  await db.insert(policies).values({
    id: `policy_${agentId}`,
    agentId,
    maxDailySpend: 500,
    perActionCap: 100,
    maxRatePerMinute: 60,
    allowedEndpoints: JSON.stringify([
      "api.stripe.com",
      "api.github.com",
      "api.openai.com",
      "api.anthropic.com",
      "api.mistral.ai",
    ]),
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

async function runGuardToolDemo() {
  const guard = new LimitrumGuard();

  const chargeCustomer = guardTool<ChargeInput, { chargeId: string; amount: number }>(guard, {
    agentId,
    toolName: "stripe.createCharge",
    target: "api.stripe.com/v1/charges",
    amount: ({ input }) => input.amount,
    execute: async (input) => ({
      chargeId: `ch_${randomUUID().slice(0, 8)}`,
      amount: input.amount,
    }),
  });

  const fetchUrl = guardTool<FetchInput, { status: number; body: string }>(guard, {
    agentId,
    toolName: "fetch",
    target: ({ input }) => input.url,
    amount: 1,
    execute: async () => ({ status: 200, body: "mocked response" }),
  });

  const shellExec = guardTool<ShellInput, { exitCode: number }>(guard, {
    agentId,
    toolName: "shell.exec",
    action: "shell.exec",
    target: "local.process",
    amount: 0,
    metadata: ({ input }) => ({ command: input.command }),
    execute: async () => ({ exitCode: 0 }),
  });

  console.log("\n1) App-owned tools protected with guardTool()");
  for (const [label, run] of [
    ["stripe.createCharge $25", () => chargeCustomer({ customerId: "cus_safe", amount: 25 })],
    ["stripe.createCharge $250", () => chargeCustomer({ customerId: "cus_large", amount: 250 })],
    ["fetch unknown domain", () => fetchUrl({ url: "api.unknown-exfil.io/private-export" })],
    ["shell.exec rm -rf", () => shellExec({ command: "rm -rf /prod/cache" })],
  ] as const) {
    const result = await run();
    printVerdict(label, result.verdict, result.executed);
  }
}

function makeMockOpenAIClient() {
  let calls = 0;
  return {
    chat: {
      completions: {
        create: async (params: unknown) => {
          calls += 1;
          if (calls === 1) {
            return {
              choices: [
                {
                  message: {
                    content: null,
                    tool_calls: [
                      {
                        function: {
                          name: "stripe.createCharge",
                          arguments: JSON.stringify({
                            amount: 250,
                            target: "api.stripe.com/v1/charges",
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            };
          }
          return {
            choices: [
              {
                message: {
                  content: `OpenAI-style tool call was blocked before execution. ${JSON.stringify(params)}`,
                },
              },
            ],
          };
        },
      },
    },
  };
}

function makeMockAnthropicClient() {
  let calls = 0;
  return {
    messages: {
      create: async (params: unknown) => {
        calls += 1;
        if (calls === 1) {
          return {
            content: [
              {
                type: "tool_use",
                name: "fetch_url",
                input: {
                  url: "api.unknown-exfil.io/customer-export",
                  amount: 1,
                },
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Claude-style tool_use was blocked before execution. ${JSON.stringify(params)}`,
            },
          ],
        };
      },
    },
  };
}

function makeMockMistralClient() {
  let calls = 0;
  return {
    chat: {
      complete: async (params: unknown) => {
        calls += 1;
        if (calls === 1) {
          return {
            choices: [
              {
                message: {
                  tool_calls: [
                    {
                      function: {
                        name: "fetch_url",
                        arguments: {
                          url: "api.unknown-exfil.io/customer-export",
                          amount: 1,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          };
        }
        return {
          choices: [
            {
              message: {
                content: `Mistral-style function call was blocked before execution. ${JSON.stringify(params)}`,
              },
            },
          ],
        };
      },
    },
  };
}

async function runProviderAdapterDemo() {
  const guard = new LimitrumGuard();

  console.log("\n2) Provider adapters gate model-proposed tool calls");

  const openai = withLimitrum(makeMockOpenAIClient(), guard, { agentId });
  const openaiResult = await openai.chat.completions.create({ messages: [] });
  const openaiMessage = openaiResult.choices?.[0]?.message as { content?: unknown } | undefined;
  console.log(`OPENAI    ${String(openaiMessage?.content ?? "").slice(0, 92)}...`);

  const anthropic = withLimitrumAnthropic(makeMockAnthropicClient(), guard, { agentId });
  const anthropicResult = await anthropic.messages.create({ messages: [] });
  const anthropicBlock = anthropicResult.content?.[0] as { text?: unknown } | undefined;
  console.log(`CLAUDE    ${String(anthropicBlock?.text ?? "").slice(0, 92)}...`);

  const mistral = withLimitrumMistral(makeMockMistralClient(), guard, { agentId });
  const mistralResult = await mistral.chat.complete({ messages: [] });
  const mistralMessage = mistralResult.choices?.[0]?.message as { content?: unknown } | undefined;
  console.log(`MISTRAL   ${String(mistralMessage?.content ?? "").slice(0, 92)}...`);
}

async function runLangChainStyleDemo() {
  const guard = new LimitrumGuard();
  const rawTool = {
    name: "fetch_url",
    description: "Fetch a URL",
    invoke: async (input: FetchInput) => `fetched ${input.url}`,
  };
  const protectedTool = withLimitrumTool(rawTool, guard, { agentId });

  console.log("\n3) LangChain-style tools are wrapped before invoke()");
  const result = await protectedTool.invoke?.({ url: "api.unknown-exfil.io/private-export" });
  console.log(`LANGCHAIN ${String(result)}`);
}

async function main() {
  await preparePolicy();

  console.log("Limitrum Agent Tool Firewall");
  console.log(`agent=${agentId}`);
  console.log("policy=allow Stripe/GitHub/model APIs, cap=$100/action, block exfiltration and shell\n");

  await runGuardToolDemo();
  await runProviderAdapterDemo();
  await runLangChainStyleDemo();

  console.log("\nResult: risky tool calls were blocked before the mocked tools executed.");
}

main().catch((error) => {
  console.error("Agent tool firewall example failed:", error);
  process.exit(1);
});
