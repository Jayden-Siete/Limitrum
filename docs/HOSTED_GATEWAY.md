# Limitrum HTTP Gateway

The open-source core includes a local HTTP gateway that exposes the same policy kernel behind an API.

This is the bridge between local SDK usage and a future managed Limitrum Cloud service:

```text
AI agent / app server
  -> POST /v1/verify-intent
  -> Limitrum policy kernel
  -> ALLOW or BLOCK
  -> app decides whether the real tool executes
```

## Run Locally

Prepare the local policy database:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the gateway:

```bash
pnpm gateway:dev
```

Health check:

```bash
curl http://localhost:8788/health
```

OpenAPI document:

```bash
curl http://localhost:8788/v1/openapi.json
```

## Verify An Intent

Allowed action:

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "agentId": "agent_sales_01",
      "action": "stripe.createCharge",
      "target": "api.stripe.com/v1/charges",
      "amount": 25
    }
  }'
```

Blocked action:

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "agentId": "agent_sales_01",
      "action": "fetch",
      "target": "api.unknown-exfil.io",
      "amount": 1
    }
  }'
```

Expected blocked shape:

```json
{
  "allowed": false,
  "decision": "blocked",
  "reason": "Domain 'api.unknown-exfil.io' is not in the allowlist.",
  "guardTriggered": "domain-allowlist",
  "enforcedBy": "limitrum-policy-kernel"
}
```

## Use The SDK In HTTP Mode

Any app using `LimitrumGuard` can delegate verification to the gateway:

```bash
LIMITRUM_API_URL=http://localhost:8788 node your-agent.js
```

Or in code:

```ts
import { LimitrumGuard } from "@limitrum/sdk";

const guard = new LimitrumGuard({
  baseUrl: "http://localhost:8788",
});

const verdict = await guard.verify({
  agentId: "agent_sales_01",
  action: "fetch",
  target: "api.unknown-exfil.io",
  amount: 1,
});

if (!verdict.allowed) {
  throw new Error(`Blocked by ${verdict.guardTriggered}: ${verdict.reason}`);
}
```

## Require A Gateway API Key

By default, the local gateway runs without auth to keep local testing fast.

Set `LIMITRUM_GATEWAY_API_KEY` to require an API key:

```bash
LIMITRUM_GATEWAY_API_KEY=dev_key pnpm gateway:dev
```

Then call it with either header:

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -H "X-Limitrum-API-Key: dev_key" \
  -d '{"intent":{"agentId":"agent_sales_01","action":"fetch","target":"api.unknown-exfil.io","amount":1}}'
```

```bash
curl -s http://localhost:8788/v1/verify-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_key" \
  -d '{"intent":{"agentId":"agent_sales_01","action":"fetch","target":"api.unknown-exfil.io","amount":1}}'
```

## What This Is Not

This is not the managed, multi-tenant Limitrum Cloud control plane.

The public gateway is a self-hostable verification API for the open-source core. The commercial product can build on this shape with hosted API keys, organizations, dashboards, long-term audit retention, SIEM exports, billing, SSO, and enterprise deployment options.
