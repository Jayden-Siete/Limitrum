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
    icon: "$",
    action: 'stripe.createCharge({ amount: 5000, currency: "usd" })',
    target: "api.stripe.com/v1/charges",
    estimatedCostUsd: 50,
    displayAction: "stripe.createCharge({ amount: 5000 })",
    description: "Approved payment inside the signed budget.",
    type: "allowed",
    reason: "budget.ok / stripe endpoint allowed / 18ms",
  },
  {
    id: "charge-1500",
    icon: "$",
    action: "stripe.createCharge({ amount: 150000 })",
    target: "api.stripe.com/v1/charges",
    estimatedCostUsd: 1500,
    displayAction: "stripe.createCharge({ amount: 150000 })",
    description: "Large payment outside the daily cap.",
    type: "blocked",
    reason: "budget.daily_cap_exceeded / remaining: $0",
  },
  {
    id: "unknown-domain",
    icon: "DNS",
    action: 'fetch("https://api.unknown-exfil.io/data")',
    target: "api.unknown-exfil.io/data",
    estimatedCostUsd: 1,
    displayAction: 'fetch("api.unknown-exfil.io/data")',
    description: "External domain is not in the allowlist.",
    type: "blocked",
    reason: "domain.not_allowed / api.unknown-exfil.io",
  },
  {
    id: "openai",
    icon: "AI",
    action: 'openai.chat.completions.create({ model: "gpt-4o" })',
    target: "api.openai.com/v1/chat/completions",
    estimatedCostUsd: 3,
    displayAction: "openai.chat.completions.create()",
    description: "Model call allowed by provider and rate policy.",
    type: "allowed",
    reason: "provider.allowed / rate.ok / 14ms",
  },
  {
    id: "syscall",
    icon: "OS",
    action: 'spawn_process("/bin/bash", ["-c", "rm -rf /var/data"])',
    target: "local.syscall/spawn_process",
    estimatedCostUsd: 0,
    displayAction: 'spawn_process("/bin/bash", ...)',
    description: "Shell execution attempts to escape the sandbox.",
    type: "blocked",
    reason: "syscall.denylist / spawn_process denied",
  },
  {
    id: "delete",
    icon: "DB",
    action: 'db.query("DELETE FROM users WHERE id > 0")',
    target: "local.db/users",
    estimatedCostUsd: 0,
    displayAction: 'db.query("DELETE FROM users WHERE ...")',
    description: "Mass destructive data mutation.",
    type: "blocked",
    reason: "destructive_action.guard / DELETE blocked",
  },
  {
    id: "github",
    icon: "GH",
    action: 'github.createIssue({ repo: "org/repo", title: "Bug found" })',
    target: "api.github.com/repos/org/repo/issues",
    estimatedCostUsd: 1,
    displayAction: 'github.createIssue({ repo: "org/repo" })',
    description: "Non-destructive issue creation on an allowed API.",
    type: "allowed",
    reason: "api.github.com allowed / non_destructive",
  },
];

export const cliPresets: Record<string, [string, string][]> = {
  "limitrum simulate": [
    ["prompt", "$ limitrum simulate"],
    ["dim", "  loading active policy..."],
    ["info", "  connected to policy kernel (18ms)"],
    ["", ""],
    ["ok", "  ALLOW  stripe.createCharge($50)        budget.ok       18ms"],
    ["err", "  BLOCK  stripe.createCharge($1500)     budget.cap       7ms"],
    ["err", "  BLOCK  fetch(api.unknown.io)          domain           9ms"],
    ["ok", "  ALLOW  openai.chat.completions()       provider.ok      14ms"],
    ["", ""],
    ["warn", "  Summary: 2/4 blocked, avg kernel latency 12ms"],
  ],
  "limitrum status": [
    ["prompt", "$ limitrum status"],
    ["info", "  kernel:  ONLINE  v1.2.4  18ms"],
    ["info", "  policy:  ACTIVE  limitrum.config.ts"],
    ["info", "  agents:  3 registered"],
    ["ok", "  budget:  $23.40 / $50.00 used today"],
    ["warn", "  alerts:  2 blocked actions in last 1h"],
  ],
  "limitrum policy show": [
    ["prompt", "$ limitrum policy show"],
    ["dim", "  # active policy hash: 8f3a2c"],
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
    ["dim", "  validating limitrum.config.ts..."],
    ["ok", "  schema valid"],
    ["dim", "  pushing to kernel..."],
    ["ok", "  policy applied, hash: 9d4b1e"],
    ["warn", "  previous policy hash 8f3a2c archived"],
  ],
  "limitrum logs --tail 20": [
    ["prompt", "$ limitrum logs --tail 20"],
    ["dim", "  time          agent          action                    verdict"],
    ["ok", "  14:22:01.183  billing-v2     stripe.charge($50)        ALLOW   18ms"],
    ["err", "  14:22:03.421  billing-v2     stripe.charge($1500)      BLOCK    7ms"],
    ["ok", "  14:22:07.009  research-v1    openai.chat.create()      ALLOW   14ms"],
    ["err", "  14:22:09.882  research-v1    fetch(api.unknown.io)     BLOCK    9ms"],
  ],
  "limitrum budget report": [
    ["prompt", "$ limitrum budget report"],
    ["dim", "  Budget Report - today UTC"],
    ["info", "  Allocated:    $50.00"],
    ["warn", "  Consumed:     $23.40  (46.8%)"],
    ["ok", "  Remaining:    $26.60"],
    ["", ""],
    ["info", "  Top consumers:"],
    ["info", "    billing-v2:    $18.40  stripe.createCharge"],
    ["info", "    research-v1:   $5.00   openai.chat"],
  ],
  "limitrum agent list": [
    ["prompt", "$ limitrum agent list"],
    ["dim", "  ID                    STATUS   ACTIONS   BLOCKED"],
    ["ok", "  billing-agent-v2      ACTIVE   1,432     8 (0.5%)"],
    ["ok", "  research-agent-v1     ACTIVE   3,210     52 (1.6%)"],
    ["warn", "  legacy-agent-v0       PAUSED   214       41 (19%)"],
  ],
  "limitrum --help": [
    ["prompt", "$ limitrum --help"],
    ["info", "  Limitrum CLI v1.2.4"],
    ["dim", "  Policy Kernel for autonomous AI agents."],
    ["", ""],
    ["info", "  Commands: simulate | status | policy show | policy apply | logs | budget | agent list"],
  ],
};

export const terminalAutoplayLines: [string, string][] = [
  ["prompt", "$ executing billing-agent-v2"],
  ["dim", "  tool call: stripe.createCharge({ amount: 5000 })"],
  ["info", "  limitrum.guard() budget: $23.40/$50 rate: 42/100"],
  ["ok", "  ALLOW delta: $50 18ms"],
  ["", ""],
  ["prompt", '$ tool call: fetch("https://api.unknown-exfil.io")'],
  ["dim", "  checking domain allowlist..."],
  ["err", "  BLOCK api.unknown-exfil.io not in allowlist 9ms"],
  ["", ""],
  ["prompt", '$ tool call: spawn_process("/bin/bash", [...])'],
  ["err", "  BLOCK syscall protection active 2ms"],
  ["", ""],
  ["prompt", "$ tool call: openai.chat.completions.create()"],
  ["ok", "  ALLOW provider policy valid 14ms"],
];
