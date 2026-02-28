export type AgentAction = {
  id: string;
  icon: string;
  action: string;
  target: string;
  estimatedCostUsd: number;
  displayAction: string;
  description: string;
  type: "allowed" | "blocked";
  reason: string;
};

export const defaultDomains = [
  "api.stripe.com",
  "api.openai.com",
  "api.github.com",
  "api.sendgrid.com",
];

export const agentActions: AgentAction[] = [
  {
    id: "charge-50",
    icon: "💳",
    action: 'stripe.createCharge({ amount: 5000, currency: "usd" })',
    target: "api.stripe.com/v1/charges",
    estimatedCostUsd: 50,
    displayAction: "stripe.createCharge({ amount: 5000 })",
    description: "Charge $50 — within daily budget",
    type: "allowed",
    reason: "budget OK · delta $50 / $50 remaining",
  },
  {
    id: "charge-1500",
    icon: "💸",
    action: 'stripe.createCharge({ amount: 150000 })',
    target: "api.stripe.com/v1/charges",
    estimatedCostUsd: 1500,
    displayAction: "stripe.createCharge({ amount: 150000 })",
    description: "Charge $1,500 — exceeds budget cap",
    type: "blocked",
    reason: "daily budget cap exceeded · remaining: $0",
  },
  {
    id: "unknown-domain",
    icon: "🌐",
    action: 'fetch("https://api.unknown-exfil.io/data")',
    target: "api.unknown-exfil.io/data",
    estimatedCostUsd: 1,
    displayAction: 'fetch("api.unknown-exfil.io/data")',
    description: "Unauthorized external domain",
    type: "blocked",
    reason: "domain not in allowlist · api.unknown-exfil.io",
  },
  {
    id: "openai",
    icon: "🤖",
    action: 'openai.chat.completions.create({ model: "gpt-4o" })',
    target: "api.openai.com/v1/chat/completions",
    estimatedCostUsd: 3,
    displayAction: "openai.chat.completions.create()",
    description: "GPT-4o call — openai.com is whitelisted",
    type: "allowed",
    reason: "api.openai.com whitelisted · rate OK",
  },
  {
    id: "syscall",
    icon: "⚠️",
    action: 'spawn_process("/bin/bash", ["-c", "rm -rf /var/data"])',
    target: "local.syscall/spawn_process",
    estimatedCostUsd: 0,
    displayAction: 'spawn_process("/bin/bash", ...)',
    description: "Shell execution — syscall blocked",
    type: "blocked",
    reason: "syscall protection · spawn_process denied",
  },
  {
    id: "delete",
    icon: "🗄️",
    action: 'db.query("DELETE FROM users WHERE id > 0")',
    target: "local.db/users",
    estimatedCostUsd: 0,
    displayAction: 'db.query("DELETE FROM users WHERE ...")',
    description: "Mass delete — destructive action blocked",
    type: "blocked",
    reason: "destructive action guard · DELETE ALL denied",
  },
  {
    id: "github",
    icon: "📋",
    action: 'github.createIssue({ repo: "org/repo", title: "Bug found" })',
    target: "api.github.com/repos/org/repo/issues",
    estimatedCostUsd: 1,
    displayAction: 'github.createIssue({ repo: "org/repo" })',
    description: "GitHub API — whitelisted and compliant",
    type: "allowed",
    reason: "api.github.com whitelisted · non-destructive",
  },
];

export const cliPresets: Record<string, [string, string][]> = {
  "limitrum simulate": [
    ["prompt", "$ limitrum simulate"],
    ["dim", "  ⟳ loading policy..."],
    ["info", "  ✓ connected to kernel (18ms)"],
    ["", ""],
    ["ok", "  ✓ ALLOWED  stripe.createCharge($50)             18ms"],
    ["err", "  ✗ BLOCKED  stripe.createCharge($1500)  budget     7ms"],
    ["err", "  ✗ BLOCKED  fetch(api.unknown.io)        domain     9ms"],
    ["ok", "  ✓ ALLOWED  openai.chat.completions()              14ms"],
    ["", ""],
    ["warn", "  Summary: 2/4 blocked · avg 12ms"],
  ],
  "limitrum status": [
    ["prompt", "$ limitrum status"],
    ["info", "  kernel:  ● ONLINE  v1.2.4  18ms"],
    ["info", "  policy:  ● ACTIVE  limitrum.config.ts"],
    ["info", "  agents:  3 registered"],
    ["ok", "  budget:  $23.40 / $50.00 used today (46%)"],
    ["warn", "  alerts:  2 blocked actions in last 1h"],
  ],
  "limitrum policy show": [
    ["prompt", "$ limitrum policy show"],
    ["dim", "  # active policy (hash: 8f3a2c)"],
    ["info", "  budget.daily:       $50"],
    ["info", "  budget.perAction:   $5"],
    ["info", "  rateLimit.max:      100/min"],
    ["ok", "  loopDetection:      true"],
    ["ok", "  syscallProtection:  true"],
    ["ok", "  dataExfil:          true"],
    ["ok", "  destructiveActions: true"],
    ["err", "  promptInjection:    false"],
  ],
  "limitrum policy apply": [
    ["prompt", "$ limitrum policy apply"],
    ["dim", "  ⟳ validating limitrum.config.ts..."],
    ["ok", "  ✓ schema valid"],
    ["dim", "  ⟳ pushing to kernel..."],
    ["ok", "  ✓ policy applied (hash: 9d4b1e)"],
    ["warn", "  ↻ old policy (hash: 8f3a2c) archived"],
  ],
  "limitrum logs --tail 20": [
    ["prompt", "$ limitrum logs --tail 20"],
    ["dim", "  timestamp            agent              action                     status"],
    ["dim", "  ─────────────────────────────────────────────────────────────────────────"],
    ["ok", "  14:22:01.183  billing-v2   stripe.createCharge($50)     ALLOWED  18ms"],
    ["err", "  14:22:03.421  billing-v2   stripe.createCharge($1500)   BLOCKED   7ms"],
    ["ok", "  14:22:07.009  research-v1  openai.chat.create()          ALLOWED  14ms"],
    ["err", "  14:22:09.882  research-v1  fetch(api.unknown.io)         BLOCKED   9ms"],
  ],
  "limitrum budget report": [
    ["prompt", "$ limitrum budget report"],
    ["dim", "  Budget Report — today (UTC)"],
    ["dim", "  ─────────────────────────────────────────"],
    ["info", "  Allocated:    $50.00"],
    ["warn", "  Consumed:     $23.40  (46.8%)"],
    ["ok", "  Remaining:    $26.60"],
    ["", ""],
    ["info", "  Top consumers:"],
    ["info", "    billing-v2:    $18.40  (stripe.createCharge)"],
    ["info", "    research-v1:   $5.00   (openai.chat)"],
  ],
  "limitrum agent list": [
    ["prompt", "$ limitrum agent list"],
    ["dim", "  ID                    STATUS   ACTIONS   BLOCKED"],
    ["dim", "  ─────────────────────────────────────────────────"],
    ["ok", "  billing-agent-v2      ACTIVE   1,432     8 (0.5%)"],
    ["ok", "  research-agent-v1     ACTIVE   3,210     52 (1.6%)"],
    ["warn", "  legacy-agent-v0       PAUSED   214       41 (19%)"],
  ],
  "limitrum --help": [
    ["prompt", "$ limitrum --help"],
    ["info", "  Limitrum CLI v1.2.4"],
    ["dim", "  The safety engine for autonomous systems."],
    ["", ""],
    ["info", "  Commands: simulate | status | policy show | policy apply | logs | budget report | agent list"],
  ],
};

export const terminalAutoplayLines: [string, string][] = [
  ["prompt", "❯ executing billing-agent-v2"],
  ["dim", "  → tool call: stripe.createCharge({ amount: 5000 })"],
  ["info", "  ⬡ limitrum.guard() · budget: $23.40/$50 · rate: 42/100"],
  ["ok", "  ✓ ALLOWED · delta: $50 · 18ms"],
  ["", ""],
  ["prompt", '❯ tool call: fetch("https://api.unknown-exfil.io")'],
  ["dim", "  ⬡ checking domain allowlist..."],
  ["err", "  ✗ BLOCKED · api.unknown-exfil.io not in allowlist · 9ms"],
  ["", ""],
  ["prompt", '❯ tool call: spawn_process("/bin/bash", [...])'],
  ["err", "  ✗ BLOCKED · syscall protection active · 2ms"],
  ["", ""],
  ["prompt", "❯ tool call: openai.chat.completions.create()"],
  ["ok", "  ✓ ALLOWED · 14ms"],
];
