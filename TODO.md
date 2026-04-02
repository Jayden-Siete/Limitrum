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
- [x] Extend DB schema (perActionCap, rateLimit, guards flags, blockedPatterns)
- [x] Implement per-action cap guard
- [x] Implement rate limiting guard
- [x] Implement loop detection guard
- [x] Implement syscall protection guard
- [x] Implement destructive action guard
- [x] Implement data exfil detection guard
- [x] Implement prompt injection shield

## Phase 3 — API Réelle
- [x] Add api_keys table to DB schema
- [x] Add API key auth middleware
- [x] GET /v1/agents
- [x] POST /v1/agents
- [x] GET /v1/agents/:id
- [x] GET /v1/agents/:id/policy
- [x] PUT /v1/agents/:id/policy
- [x] GET /v1/logs (paginated)
- [x] GET /v1/budget/report
- [x] GET /v1/agents/:id/status

## Phase 4 — CLI Réel
- [x] limitrum status
- [x] limitrum policy show
- [x] limitrum policy apply
- [x] limitrum logs --tail
- [x] limitrum budget report
- [x] limitrum agent list

## Phase 5 — Web App Réelle
- [x] Dashboard layout
- [x] Dashboard overview page
- [x] Agents list page
- [x] Agent detail + policy editor
- [x] Logs viewer (paginated, filterable)
- [x] Budget report page
- [ ] Connect sandbox to real API (Apply Policy)
