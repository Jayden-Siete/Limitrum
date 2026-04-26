# Limitrum Pitch Deck

## 1. Title

Limitrum is the policy kernel for autonomous AI agents.

Agents are getting access to money, code, customer data, infrastructure, and external APIs. Limitrum verifies each high-risk intent before execution, then returns an allow or block verdict with an audit trail.

## 2. Problem

AI agents are moving from chat into operations, but teams still lack a deterministic runtime boundary.

- Prompts are not enforceable security controls.
- Existing observability tools tell teams what happened after the action.
- Agents can overspend, call unknown APIs, mutate data, spawn processes, or leak data.
- Engineering teams need a simple way to let agents act without giving them unconditional power.

## 3. Why Now

The market is shifting from AI copilots to AI workers.

- Tool-calling agents are becoming standard in developer platforms.
- MCP and workflow agents increase the number of external actions per agent.
- Model quality makes autonomy useful, but governance and runtime safety lag behind.
- Enterprises will not deploy autonomous agents broadly without enforceable policy, auditability, and controls.

## 4. Solution

Limitrum sits between agent intent and real-world execution.

An agent asks to perform an action. Limitrum normalizes that action into an intent, checks deterministic policy, returns a decision, and writes the audit log.

Core checks today:

- Daily budget and per-action cost caps
- Domain allowlists
- Rate limits
- Loop detection
- Syscall and process-spawn protection
- Destructive action detection
- Data exfiltration guard
- Prompt-injection pattern detection
- Custom blocked patterns
- API key lifecycle and audit logs

## 5. Product

Developers install the SDK and wrap sensitive tool calls.

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard();

const verdict = await guard.verify({
  agentId: "billing-agent",
  action: "stripe.createCharge",
  target: "api.stripe.com/v1/charges",
  estimatedCostUsd: 50,
});

if (!verdict.allowed) throw new Error(verdict.reason);
```

The MVP includes:

- TypeScript SDK
- Hono API service
- SQLite-backed local policy kernel
- Policy, agent, logs, budget, metrics, and API-key endpoints
- Interactive website sandbox
- Dashboard data hooks
- Unit and integration test suites

## 6. Market

Initial wedge: developer teams building agents that can call tools, spend money, or touch customer data.

Initial buyers:

- AI app startups
- Devtool companies adding agent workflows
- SaaS teams adding autonomous support, sales, finance, or ops agents
- Enterprise platform teams standardizing internal agents

Long-term category: runtime security and governance for autonomous software.

## 7. Differentiation

Limitrum is enforcement-first.

- It is not just logging or monitoring.
- It does not depend on model compliance.
- It can run locally or as a hosted policy API.
- It gives developers a small SDK surface, not a heavy platform migration.
- Open-source core builds trust with developers while hosted plans monetize operations, team controls, and enterprise deployment.

## 8. Business Model

Open-core with hosted cloud and enterprise.

- Open Source: free self-hosted SDK and local kernel.
- Developer Cloud: $49/month for hosted policy API, 50k verifications, key lifecycle, budget reports.
- Team: $249/month for 500k verifications, shared policies, SIEM export, custom patterns, priority support.
- Enterprise: custom VPC/on-prem, SSO, SLA, security review, custom guardrails.

Open source is not a problem for the go-to-market. For a developer security product, it can be an advantage because it earns trust and accelerates adoption. The commercial moat should be hosted reliability, policy operations, enterprise integrations, compliance, and support.

## 9. Go-To-Market

Developer-led wedge:

- Launch with a working sandbox and SDK examples.
- Publish “unsafe agent tool call” demos.
- Target MCP, LangChain, Vercel AI SDK, and OpenAI/Anthropic agent builders.
- Create templates for common risky actions: payments, code execution, database mutation, outbound network, customer data export.
- Convert open-source users into hosted teams when they need shared policies, audit retention, key management, and production uptime.

## 10. Traction Plan

Near-term proof points to build before fundraising:

- 5-10 design partners building real agents
- Public demo that blocks meaningful risky actions
- GitHub stars and SDK downloads
- 2-3 integrations beyond plain TypeScript
- Example repos for payments, browser agents, MCP tools, and code-execution agents
- Security write-up explaining threat model and fail-closed behavior

## 11. Competition

Adjacent categories:

- LLM observability
- API gateways
- Policy engines such as OPA
- Agent frameworks with built-in guardrails
- Cloud security posture tools

Limitrum competes by being specific to agent intent verification, lightweight enough for developers, and enforcement-oriented before execution.

## 12. Roadmap

MVP:

- SDK, API, policy kernel, audit logs, sandbox, dashboard basics

Next:

- Hosted API deployment with durable Postgres
- Auth and team workspaces
- Policy versioning and approvals
- MCP middleware
- LangChain and Vercel AI SDK examples
- SIEM export
- Policy templates

Enterprise:

- SSO, SCIM, RBAC
- VPC/on-prem deployment
- Advanced policy language
- Compliance reporting
- Security review package

## 13. Ask

Raise a pre-seed round to turn Limitrum from working MVP into the default runtime policy layer for agent builders.

Use of funds:

- Ship hosted cloud
- Build integrations and examples
- Acquire design partners
- Harden security, observability, and enterprise deployment
- Create developer content and launch distribution

## 14. Closing

AI agents need a kernel, not just a prompt.

Limitrum gives builders the confidence to let agents act in the real world while keeping money, data, systems, and auditability under deterministic control.
