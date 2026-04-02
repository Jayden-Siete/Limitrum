# Limitrum — Implementation TODO

## Phase 1 — Stabilisation
- [x] Analyse complète du projet
- [x] Fix .gitignore (auth, auth-wal)
- [x] Create .env.example
- [x] Fix Anthropic adapter (system message bug)
- [x] Fix LimitrumGuard baseUrl (HTTP client mode)
- [x] Fix landing page (page.tsx → LandingPage component)
- [x] Fix next.config.ts (remove ignoreDuringBuilds)

## Phase 2 — Policy Kernel Complet
- [ ] Extend DB schema (perActionCap, rateLimit, guards flags, blockedPatterns)
- [ ] Implement per-action cap guard
- [ ] Implement rate limiting guard
- [ ] Implement loop detection guard
- [ ] Implement syscall protection guard
- [ ] Implement destructive action guard
- [ ] Implement data exfil detection guard
- [ ] Implement prompt injection shield

## Phase 3 — API Réelle
- [ ] Add api_keys table to DB schema
- [ ] Add API key auth middleware
- [ ] GET /v1/agents
- [ ] POST /v1/agents
- [ ] GET /v1/agents/:id
- [ ] GET /v1/agents/:id/policy
- [ ] PUT /v1/agents/:id/policy
- [ ] GET /v1/logs (paginated)
- [ ] GET /v1/budget/report
- [ ] GET /v1/agents/:id/status

## Phase 4 — CLI Réel
- [ ] limitrum status
- [ ] limitrum policy show
- [ ] limitrum policy apply
- [ ] limitrum logs --tail
- [ ] limitrum budget report
- [ ] limitrum agent list

## Phase 5 — Web App Réelle
- [ ] Dashboard layout
- [ ] Dashboard overview page
- [ ] Agents list page
- [ ] Agent detail + policy editor
- [ ] Logs viewer (paginated, filterable)
- [ ] Budget report page
- [ ] Connect sandbox to real API (Apply Policy)
