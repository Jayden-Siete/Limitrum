# Commercial Boundary

Limitrum uses an open-core model.

The public repository is designed to be useful, inspectable, and trustworthy for developers building autonomous agents locally. It does not include the hosted commercial control plane.

## Open Source Core

The MIT-licensed core includes:

- TypeScript SDK
- local policy kernel
- local SQLite policy and audit store
- CLI simulator
- MCP server
- local HTTP verification gateway
- OpenAI, Anthropic, and LangChain adapters
- local examples and unit tests

This is enough to:

- wrap sensitive tool calls
- verify an intent before execution
- block high-risk actions
- log local audit decisions
- test policy behavior without model spend

## Commercial / Hosted Product

The hosted product is not part of this repository.

Commercial capabilities include:

- managed multi-tenant Limitrum Cloud API
- production dashboard
- organization and team workspaces
- hosted API-key lifecycle
- RBAC, SSO, SCIM
- long-term audit retention
- SIEM export
- usage metering and billing
- policy approval workflows
- VPC or on-prem deployment
- security review and support packages

## Rule Of Thumb

If it helps a developer understand, inspect, test, or self-host the policy kernel locally, it belongs in the open-source core.

If it runs the hosted business, manages customer accounts, stores production audit trails, controls billing, or provides enterprise operations, it belongs outside the public repo.
