# How Limitrum Works And How To Test It

## What Limitrum Is

Limitrum is a policy decision point for AI agents. Before an agent executes a sensitive action, the application sends an intent to Limitrum. Limitrum checks the active policy and returns a deterministic verdict.

The current MVP has three layers:

- `packages/sdk`: TypeScript SDK with `LimitrumGuard`.
- `apps/api`: Hono HTTP API exposing health, verify-intent, agents, policy, logs, budget, metrics, and API key endpoints.
- `apps/web`: Next.js static site with a working browser sandbox and marketing/demo surface.

## Runtime Flow

1. Agent plans a tool call.
2. App creates an intent: `agentId`, `action`, `target`, cost estimate, metadata.
3. `LimitrumGuard.verify()` checks the intent.
4. The kernel loads the agent policy.
5. Guards run in order: syscall, domain, budget, per-action cap, rate limit, loop detection, destructive action, data exfiltration, prompt injection, custom patterns.
6. Limitrum returns `allowed` or `blocked` with a reason.
7. The decision is written to `intent_logs`.
8. The app executes the tool only if `allowed` is true.

## What Works Today

- Local SQLite-backed policy kernel
- Public `/health`
- `/v1/verify-intent`
- Protected REST API with API-key auth
- Agent CRUD
- Policy update and status
- Audit logs
- Budget reporting
- Metrics summary
- API key create, list, rotate, revoke, delete
- Browser sandbox that works on the public static site without localhost
- Unit and integration tests for SDK and API behavior

## Local Setup

From the repo root:

```bash
npx pnpm install
npx pnpm db:migrate
npx pnpm db:seed
npx pnpm --filter @limitrum/api dev
```

Then check:

```bash
curl http://localhost:8000/health
```

The seed script prints a demo API key the first time it creates one. Use that key for protected endpoints.

## Test The API

Health:

```bash
curl http://localhost:8000/health
```

Verify an allowed intent:

```bash
curl -X POST http://localhost:8000/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d "{\"intent\":{\"agentId\":\"agent_sales_01\",\"action\":\"openai.chat.completions.create\",\"target\":\"api.openai.com/v1/chat/completions\",\"estimatedCostUsd\":3}}"
```

Verify a blocked intent:

```bash
curl -X POST http://localhost:8000/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d "{\"intent\":{\"agentId\":\"agent_sales_01\",\"action\":\"spawn_process('/bin/bash')\",\"target\":\"local.syscall/spawn_process\",\"estimatedCostUsd\":0}}"
```

Expected result: first request should be allowed, second should be blocked by syscall protection.

## Test The Web Sandbox

Run:

```bash
npx pnpm --filter @limitrum/web dev
```

Open `http://localhost:3000`.

What to test:

- Change budget, rate, and per-action cap.
- Add or remove allowed domains.
- Toggle guards.
- Click `Apply policy`.
- Go to `Simulation`.
- Select actions such as a Stripe charge, unknown domain, syscall, or DB delete.
- Click `Run selected intents`.

The verdicts should change based on the policy you configured. This works even without an API server because the landing page now includes a browser-side deterministic demo kernel for the public sandbox.

## Test The Full Suite

```bash
npx pnpm --filter @limitrum/tests test:unit
npx pnpm --filter @limitrum/tests test:integration
npx pnpm --filter @limitrum/web typecheck
npx pnpm --filter @limitrum/web build
```

## Production Readiness Status

Ready for MVP demos:

- SDK and API core are real.
- Guards return deterministic reasons.
- Logs and budget reports exist.
- API keys can be rotated and revoked.
- Site sandbox is functional without a backend dependency.

Not fully production-ready yet:

- Hosted API needs durable Postgres or another managed database.
- Authentication should become organization/user-based, not just master/demo keys.
- Web dashboard needs a real login flow.
- Policies need versioning, approvals, and rollback.
- Observability should include structured logs, tracing, uptime checks, and alerting.
- Security docs should define threat model, fail-closed behavior, and responsible disclosure.

## Commercialization Notes

Keep the core open source unless enterprise customers require a private distribution. For developer security infrastructure, open source increases trust and improves adoption.

Commercialize around:

- Hosted policy API
- Team workspaces
- Long-term audit retention
- Key lifecycle and RBAC
- SIEM export
- Enterprise support
- VPC/on-prem deployment
- Compliance and security review package
