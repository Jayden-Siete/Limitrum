import { randomUUID } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@limitrum/db";
import { intentLogs, policies } from "@limitrum/db";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Input / Output types
// ─────────────────────────────────────────────────────────────────────────────

const verifyIntentInputSchema = z.object({
  agentId: z.string().min(1),
  action: z.string().min(1),
  target: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  estimatedCostUsd: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type VerifyIntentInput = z.input<typeof verifyIntentInputSchema>;

export type VerifyIntentResult = {
  allowed: boolean;
  decision: "allowed" | "blocked";
  reason: string;
  guardTriggered?: string;
  policyId?: string;
  cumulativeSpent: number;
  remainingBudget: number;
  latencyMs?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Guard result helper
// ─────────────────────────────────────────────────────────────────────────────

type BlockResult = {
  blocked: true;
  reason: string;
  guardTriggered: string;
};

type PassResult = {
  blocked: false;
};

type GuardResult = BlockResult | PassResult;

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function normalizeTargetHost(target: string): string {
  try {
    const withProtocol = target.includes("://") ? target : `https://${target}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return target.toLowerCase().split("/")[0] ?? target.toLowerCase();
  }
}

function parseAllowlist(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.toLowerCase());
  } catch {
    return [];
  }
}

function parseBlockedPatterns(raw: string): RegExp[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is string => typeof p === "string")
      .map((p) => {
        try {
          return new RegExp(p, "i");
        } catch {
          return null;
        }
      })
      .filter((r): r is RegExp => r !== null);
  } catch {
    return [];
  }
}

function getStartOfUtcDayTimestampMs(nowMs: number): number {
  const date = new Date(nowMs);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function metadataToString(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return "";
  try {
    return JSON.stringify(metadata).toLowerCase();
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Syscall protection patterns
// ─────────────────────────────────────────────────────────────────────────────

const SYSCALL_TARGET_PATTERNS = [
  /^local\.syscall/i,
  /^local\.process/i,
  /^local\.fs/i,
  /spawn_process/i,
  /exec_command/i,
  /shell_exec/i,
  /\/bin\//i,
  /\/usr\/bin\//i,
  /cmd\.exe/i,
  /powershell/i,
];

const SYSCALL_ACTION_PATTERNS = [
  /spawn_process/i,
  /exec_command/i,
  /shell_exec/i,
  /os\.system/i,
  /subprocess/i,
  /child_process/i,
  /execSync/i,
  /spawnSync/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// Destructive action patterns
// ─────────────────────────────────────────────────────────────────────────────

const DESTRUCTIVE_ACTION_PATTERNS = [
  /\bDELETE\b.*\bFROM\b/i,
  /\bDROP\b.*\bTABLE\b/i,
  /\bDROP\b.*\bDATABASE\b/i,
  /\bTRUNCATE\b/i,
  /rm\s+-rf/i,
  /rmdir\s+\/s/i,
  /format\s+[a-z]:/i,
  /delete_data/i,
  /wipe_database/i,
  /purge_all/i,
  /mass_delete/i,
  /bulk_delete/i,
];

const DESTRUCTIVE_TARGET_PATTERNS = [
  /local\.db\//i,
  /local\.fs\/delete/i,
  /local\.fs\/wipe/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// Prompt injection patterns
// ─────────────────────────────────────────────────────────────────────────────

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+(a\s+)?(?:different|new|another)/i,
  /act\s+as\s+(?:if\s+you\s+are\s+)?(?:a\s+)?(?:different|unrestricted|jailbroken)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /bypass\s+(all\s+)?(?:safety|policy|restriction)/i,
  /override\s+(all\s+)?(?:safety|policy|restriction)/i,
  /\bsystem\s+prompt\b.*\bignore\b/i,
  /\bignore\b.*\bsystem\s+prompt\b/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// LimitrumGuard options
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PRODUCTION_API_URL = "https://api.limitrum.cloud";

export type LimitrumGuardOptions = {
  /**
   * Base URL of the Limitrum Policy Kernel API.
   * When set, the guard operates in HTTP client mode — no local DB required.
   * When omitted, the guard uses the local SQLite database directly.
   */
  baseUrl?: string;
  /**
   * API key for authenticating with the Limitrum API (HTTP client mode).
   */
  apiKey?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// LimitrumGuard — The Policy Kernel
// ─────────────────────────────────────────────────────────────────────────────

export class LimitrumGuard {
  public readonly baseUrl: string | null;
  private readonly apiKey: string | undefined;
  /** True when operating in HTTP client mode (no local DB) */
  private readonly httpMode: boolean;

  constructor(options: LimitrumGuardOptions = {}) {
    const envApiUrl = process.env.LIMITRUM_API_URL;
    const envApiKey = process.env.LIMITRUM_API_KEY;

    this.apiKey = options.apiKey ?? envApiKey;

    // Determine mode:
    // 1. If baseUrl is explicitly provided → HTTP mode
    // 2. If LIMITRUM_API_URL env is set and non-empty → HTTP mode
    // 3. If NODE_ENV=production and no explicit local override → HTTP mode (default prod URL)
    // 4. Otherwise → local DB mode
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
      this.httpMode = true;
    } else if (envApiUrl && envApiUrl.trim() !== "" && envApiUrl !== "http://localhost:8000") {
      this.baseUrl = envApiUrl;
      this.httpMode = true;
    } else if (process.env.NODE_ENV === "production" && !envApiUrl) {
      this.baseUrl = DEFAULT_PRODUCTION_API_URL;
      this.httpMode = true;
    } else {
      this.baseUrl = null;
      this.httpMode = false;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  async verify(input: VerifyIntentInput): Promise<VerifyIntentResult> {
    const startedAt = performance.now();

    if (this.httpMode && this.baseUrl) {
      return this.verifyViaHttp(input, startedAt);
    }

    return this.verifyViaDb(input, startedAt);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HTTP client mode — delegates to the Limitrum API
  // ───────────────────────────────────────────────────────────────────────────

  private async verifyViaHttp(
    input: VerifyIntentInput,
    startedAt: number,
  ): Promise<VerifyIntentResult> {
    const url = `${this.baseUrl}/v1/verify-intent`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["X-Limitrum-API-Key"] = this.apiKey;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ intent: input }),
      });
    } catch (err) {
      // Fail-safe: if the API is unreachable, block the action.
      const reason = `Limitrum API unreachable (${err instanceof Error ? err.message : "network error"}). Failing safe — action blocked.`;
      return {
        allowed: false,
        decision: "blocked",
        reason,
        guardTriggered: "api-unreachable",
        cumulativeSpent: 0,
        remainingBudget: 0,
        latencyMs: Math.max(0.01, performance.now() - startedAt),
      };
    }

    if (!response.ok) {
      const reason = `Limitrum API returned HTTP ${response.status}. Failing safe — action blocked.`;
      return {
        allowed: false,
        decision: "blocked",
        reason,
        guardTriggered: "api-error",
        cumulativeSpent: 0,
        remainingBudget: 0,
        latencyMs: Math.max(0.01, performance.now() - startedAt),
      };
    }

    const data = (await response.json()) as {
      decision: "allowed" | "blocked";
      reason: string;
      guardTriggered?: string;
      policyId?: string;
      cumulativeSpent?: number;
      remainingBudget?: number;
    };

    return {
      allowed: data.decision === "allowed",
      decision: data.decision,
      reason: data.reason,
      guardTriggered: data.guardTriggered,
      policyId: data.policyId,
      cumulativeSpent: data.cumulativeSpent ?? 0,
      remainingBudget: data.remainingBudget ?? 0,
      latencyMs: Math.max(0.01, performance.now() - startedAt),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Local DB mode — full policy evaluation in-process
  // ───────────────────────────────────────────────────────────────────────────

  private async verifyViaDb(
    rawInput: VerifyIntentInput,
    startedAt: number,
  ): Promise<VerifyIntentResult> {
    const intent = verifyIntentInputSchema.parse(rawInput);
    const now = Date.now();
    const amount = intent.amount ?? intent.estimatedCostUsd ?? 0;

    // ── 1. Load policy ──────────────────────────────────────────────────────
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.agentId, intent.agentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!policy) {
      const reason = `No policy found for agent '${intent.agentId}'.`;
      await this.writeLog({
        agentId: intent.agentId,
        policyId: null,
        action: intent.action,
        target: intent.target,
        decision: "blocked",
        reason,
        guardTriggered: "no-policy",
        amount,
        estimatedCostUsd: intent.estimatedCostUsd ?? amount,
        createdAt: now,
      });
      return {
        allowed: false,
        decision: "blocked",
        reason,
        guardTriggered: "no-policy",
        cumulativeSpent: 0,
        remainingBudget: 0,
        latencyMs: Math.max(0.01, performance.now() - startedAt),
      };
    }

    // ── 2. Compute cumulative spend for today ───────────────────────────────
    const startOfUtcDay = getStartOfUtcDayTimestampMs(now);
    const aggregate = await db
      .select({
        total: sql<number>`coalesce(sum(${intentLogs.amount}), 0)`,
      })
      .from(intentLogs)
      .where(
        and(
          eq(intentLogs.agentId, intent.agentId),
          eq(intentLogs.decision, "allowed"),
          gte(intentLogs.createdAt, startOfUtcDay),
        ),
      )
      .then((rows) => rows[0]);

    const cumulativeSpent = Number(aggregate?.total ?? 0);
    const remainingBudget = Math.max(0, policy.maxDailySpend - cumulativeSpent);

    // ── 3. Run all guards in order ──────────────────────────────────────────
    const targetHost = normalizeTargetHost(intent.target);
    const allowedEndpoints = parseAllowlist(policy.allowedEndpoints);
    const blockedPatterns = parseBlockedPatterns(policy.blockedPatterns);
    const metaStr = metadataToString(intent.metadata);

    const guards: Array<() => Promise<GuardResult> | GuardResult> = [
      // Guard 1: Domain allowlist
      () => this.checkDomainAllowlist(targetHost, allowedEndpoints),
      // Guard 2: Daily budget cap
      () => this.checkDailyBudget(amount, cumulativeSpent, policy.maxDailySpend, remainingBudget),
      // Guard 3: Per-action cap
      () => this.checkPerActionCap(amount, policy.perActionCap),
      // Guard 4: Rate limiting
      () => this.checkRateLimit(intent.agentId, policy.maxRatePerMinute, now),
      // Guard 5: Loop detection
      () =>
        this.checkLoopDetection(
          intent.agentId,
          intent.action,
          intent.target,
          policy.loopDetectionEnabled,
          policy.loopDetectionMaxCount,
          policy.loopDetectionWindowSec,
          now,
        ),
      // Guard 6: Syscall protection
      () =>
        this.checkSyscallProtection(
          intent.action,
          intent.target,
          policy.syscallProtectionEnabled,
        ),
      // Guard 7: Destructive action guard
      () =>
        this.checkDestructiveActions(
          intent.action,
          intent.target,
          policy.destructiveActionsEnabled,
        ),
      // Guard 8: Data exfiltration detection
      () =>
        this.checkDataExfil(
          targetHost,
          allowedEndpoints,
          policy.dataExfilEnabled,
        ),
      // Guard 9: Prompt injection shield
      () =>
        this.checkPromptInjection(
          intent.action,
          metaStr,
          policy.promptInjectionEnabled,
        ),
      // Guard 10: Custom blocked patterns
      () => this.checkBlockedPatterns(intent.action, intent.target, blockedPatterns),
    ];

    let decision: "allowed" | "blocked" = "allowed";
    let reason = "Intent accepted by deterministic policy kernel.";
    let guardTriggered: string | undefined;

    for (const guard of guards) {
      const result = await guard();
      if (result.blocked) {
        decision = "blocked";
        reason = result.reason;
        guardTriggered = result.guardTriggered;
        break;
      }
    }

    // ── 4. Write audit log ──────────────────────────────────────────────────
    await this.writeLog({
      agentId: intent.agentId,
      policyId: policy.id,
      action: intent.action,
      target: intent.target,
      decision,
      reason,
      guardTriggered: guardTriggered ?? null,
      amount,
      estimatedCostUsd: intent.estimatedCostUsd ?? amount,
      createdAt: now,
    });

    return {
      allowed: decision === "allowed",
      decision,
      reason,
      guardTriggered,
      policyId: policy.id,
      cumulativeSpent,
      remainingBudget,
      latencyMs: Math.max(0.01, performance.now() - startedAt),
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Individual Guards
  // ───────────────────────────────────────────────────────────────────────────

  /** Guard 1 — Domain allowlist */
  private checkDomainAllowlist(targetHost: string, allowedEndpoints: string[]): GuardResult {
    if (allowedEndpoints.length === 0) {
      // No allowlist configured → pass (open policy)
      return { blocked: false };
    }
    const isAllowed = allowedEndpoints.some(
      (allowed) => targetHost === allowed || targetHost.endsWith(`.${allowed}`),
    );
    if (!isAllowed) {
      return {
        blocked: true,
        reason: `Domain '${targetHost}' is not in the allowlist.`,
        guardTriggered: "domain-allowlist",
      };
    }
    return { blocked: false };
  }

  /** Guard 2 — Daily budget cap */
  private checkDailyBudget(
    amount: number,
    cumulativeSpent: number,
    maxDailySpend: number,
    remainingBudget: number,
  ): GuardResult {
    if (amount > 0 && cumulativeSpent + amount > maxDailySpend) {
      return {
        blocked: true,
        reason: `Daily budget exceeded. Remaining: $${remainingBudget.toFixed(2)}. Requested: $${amount.toFixed(2)}.`,
        guardTriggered: "budget-daily",
      };
    }
    return { blocked: false };
  }

  /** Guard 3 — Per-action cost cap */
  private checkPerActionCap(amount: number, perActionCap: number): GuardResult {
    if (perActionCap > 0 && amount > perActionCap) {
      return {
        blocked: true,
        reason: `Action cost $${amount.toFixed(2)} exceeds per-action cap of $${perActionCap.toFixed(2)}.`,
        guardTriggered: "budget-per-action",
      };
    }
    return { blocked: false };
  }

  /** Guard 4 — Rate limiting (actions per minute) */
  private async checkRateLimit(
    agentId: string,
    maxRatePerMinute: number,
    now: number,
  ): Promise<GuardResult> {
    if (maxRatePerMinute <= 0) return { blocked: false };

    const oneMinuteAgo = now - 60_000;
    const recentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(intentLogs)
      .where(
        and(
          eq(intentLogs.agentId, agentId),
          gte(intentLogs.createdAt, oneMinuteAgo),
        ),
      )
      .then((rows) => Number(rows[0]?.count ?? 0));

    if (recentCount >= maxRatePerMinute) {
      return {
        blocked: true,
        reason: `Rate limit exceeded: ${recentCount} actions in the last minute (max: ${maxRatePerMinute}/min).`,
        guardTriggered: "rate-limit",
      };
    }
    return { blocked: false };
  }

  /** Guard 5 — Loop detection (repeated identical action+target in a time window) */
  private async checkLoopDetection(
    agentId: string,
    action: string,
    target: string,
    enabled: number,
    maxCount: number,
    windowSec: number,
    now: number,
  ): Promise<GuardResult> {
    if (!enabled) return { blocked: false };

    const windowStart = now - windowSec * 1000;
    const identicalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(intentLogs)
      .where(
        and(
          eq(intentLogs.agentId, agentId),
          eq(intentLogs.action, action),
          eq(intentLogs.target, target),
          gte(intentLogs.createdAt, windowStart),
        ),
      )
      .then((rows) => Number(rows[0]?.count ?? 0));

    if (identicalCount >= maxCount) {
      return {
        blocked: true,
        reason: `Loop detected: action '${action}' on '${target}' repeated ${identicalCount} times in ${windowSec}s (max: ${maxCount}).`,
        guardTriggered: "loop-detection",
      };
    }
    return { blocked: false };
  }

  /** Guard 6 — Syscall / process-spawn protection */
  private checkSyscallProtection(
    action: string,
    target: string,
    enabled: number,
  ): GuardResult {
    if (!enabled) return { blocked: false };

    for (const pattern of SYSCALL_TARGET_PATTERNS) {
      if (pattern.test(target)) {
        return {
          blocked: true,
          reason: `Syscall protection: target '${target}' matches blocked syscall pattern.`,
          guardTriggered: "syscall-protection",
        };
      }
    }
    for (const pattern of SYSCALL_ACTION_PATTERNS) {
      if (pattern.test(action)) {
        return {
          blocked: true,
          reason: `Syscall protection: action '${action}' matches blocked syscall pattern.`,
          guardTriggered: "syscall-protection",
        };
      }
    }
    return { blocked: false };
  }

  /** Guard 7 — Destructive action guard */
  private checkDestructiveActions(
    action: string,
    target: string,
    enabled: number,
  ): GuardResult {
    if (!enabled) return { blocked: false };

    for (const pattern of DESTRUCTIVE_ACTION_PATTERNS) {
      if (pattern.test(action)) {
        return {
          blocked: true,
          reason: `Destructive action guard: action '${action}' matches destructive pattern.`,
          guardTriggered: "destructive-action",
        };
      }
    }
    for (const pattern of DESTRUCTIVE_TARGET_PATTERNS) {
      if (pattern.test(target)) {
        return {
          blocked: true,
          reason: `Destructive action guard: target '${target}' matches destructive pattern.`,
          guardTriggered: "destructive-action",
        };
      }
    }
    return { blocked: false };
  }

  /** Guard 8 — Data exfiltration detection */
  private checkDataExfil(
    targetHost: string,
    allowedEndpoints: string[],
    enabled: number,
  ): GuardResult {
    if (!enabled) return { blocked: false };
    // Data exfil = external domain not in allowlist
    // This is a secondary check after domain allowlist — catches cases where
    // allowlist is empty but dataExfil guard is explicitly enabled.
    if (allowedEndpoints.length > 0) {
      // Already handled by domain allowlist guard
      return { blocked: false };
    }
    // If no allowlist is configured but dataExfil is enabled, block all external HTTP targets
    const isExternal =
      !targetHost.startsWith("local.") &&
      !targetHost.startsWith("localhost") &&
      !targetHost.startsWith("127.") &&
      !targetHost.startsWith("::1");

    if (isExternal) {
      return {
        blocked: true,
        reason: `Data exfiltration guard: external target '${targetHost}' blocked (no allowlist configured).`,
        guardTriggered: "data-exfil",
      };
    }
    return { blocked: false };
  }

  /** Guard 9 — Prompt injection shield */
  private checkPromptInjection(
    action: string,
    metaStr: string,
    enabled: number,
  ): GuardResult {
    if (!enabled) return { blocked: false };

    const combined = `${action} ${metaStr}`;
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          blocked: true,
          reason: `Prompt injection shield: suspicious pattern detected in action or metadata.`,
          guardTriggered: "prompt-injection",
        };
      }
    }
    return { blocked: false };
  }

  /** Guard 10 — Custom blocked patterns (user-defined regex) */
  private checkBlockedPatterns(
    action: string,
    target: string,
    patterns: RegExp[],
  ): GuardResult {
    if (patterns.length === 0) return { blocked: false };

    const combined = `${action} ${target}`;
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return {
          blocked: true,
          reason: `Custom policy pattern matched: '${pattern.source}'.`,
          guardTriggered: "custom-pattern",
        };
      }
    }
    return { blocked: false };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Audit log writer
  // ───────────────────────────────────────────────────────────────────────────

  private async writeLog(entry: {
    agentId: string;
    policyId: string | null;
    action: string;
    target: string;
    decision: "allowed" | "blocked";
    reason: string;
    guardTriggered: string | null;
    amount: number;
    estimatedCostUsd: number;
    createdAt: number;
  }): Promise<void> {
    await db.insert(intentLogs).values({
      id: randomUUID(),
      agentId: entry.agentId,
      policyId: entry.policyId,
      action: entry.action,
      target: entry.target,
      decision: entry.decision,
      reason: entry.reason,
      guardTriggered: entry.guardTriggered,
      amount: entry.amount,
      estimatedCostUsd: entry.estimatedCostUsd,
      createdAt: entry.createdAt,
    });
  }
}
