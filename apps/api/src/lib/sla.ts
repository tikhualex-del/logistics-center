// ─── SLA / Deadline Control ────────────────────────────────────────────────────
// Pure computation helpers — no DB access, no AppError, no side effects.
// All functions accept an explicit `now` so callers can pin the clock once per
// request and get consistent results across a batch of orders.

// At-risk window: 30 minutes before deadline (hardcoded for MVP)
export const SLA_AT_RISK_WINDOW_MS = 30 * 60 * 1000;

// Active order statuses for SLA monitoring purposes
const ACTIVE_SLA_STATUSES = new Set(['new', 'assigned', 'picked_up']);

// ─── SLA status vocabulary ─────────────────────────────────────────────────────
//
// Two semantic groups, unified into one field on Order:
//
// Active monitoring states (order in progress):
//   no_deadline — no deadline set; SLA not tracked
//   on_track    — deadline set, outside at-risk window
//   at_risk     — deadline set, within 30-minute window
//   overdue     — deadline set, deadline has passed
//
// Terminal outcomes (order complete):
//   met         — delivered on time (deliveredAt ≤ deadline)
//   breached    — delivered late (deliveredAt > deadline) OR failed with deadline set
//   exempt      — cancelled; excluded from SLA statistics
//   no_deadline — terminal with no deadline set (not cancelled)
//
// `no_deadline` appears in both groups with the same semantics: SLA not applicable.

export type SlaStatus =
  | 'no_deadline'
  | 'on_track'
  | 'at_risk'
  | 'overdue'
  | 'met'
  | 'breached'
  | 'exempt';

export const SLA_STATUSES: readonly SlaStatus[] = [
  'no_deadline',
  'on_track',
  'at_risk',
  'overdue',
  'met',
  'breached',
  'exempt',
];

// ─── SlaSummary shape ─────────────────────────────────────────────────────────
// Stable aggregate over all member orders on a Route.
// Shape is fixed: every key always present, 0 when empty.
// Invariant: total === sum of all other fields.

export interface SlaSummary {
  total: number;
  no_deadline: number;
  on_track: number;
  at_risk: number;
  overdue: number;
  met: number;
  breached: number;
  exempt: number;
}

// ─── Minimal order fields needed for SLA computation ─────────────────────────

export interface SlaOrderInput {
  status: string;
  deadline: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
}

// ─── computeSlaStatus ─────────────────────────────────────────────────────────
// Derives slaStatus from an order's current fields.
// `now` defaults to the current time but callers should pass a pinned value.

export function computeSlaStatus(order: SlaOrderInput, now: Date = new Date()): SlaStatus {
  const { status, deadline, deliveredAt } = order;

  // cancelled → always exempt, regardless of deadline
  if (status === 'cancelled') return 'exempt';

  // Active order (new | assigned | picked_up)
  if (ACTIVE_SLA_STATUSES.has(status)) {
    if (deadline === null) return 'no_deadline';
    const msRemaining = deadline.getTime() - now.getTime();
    if (msRemaining < 0) return 'overdue';
    if (msRemaining <= SLA_AT_RISK_WINDOW_MS) return 'at_risk';
    return 'on_track';
  }

  // Terminal: delivered
  if (status === 'delivered') {
    if (deadline === null || deliveredAt === null) return 'no_deadline';
    return deliveredAt.getTime() <= deadline.getTime() ? 'met' : 'breached';
  }

  // Terminal: failed — always breached when deadline was set
  if (status === 'failed') {
    return deadline === null ? 'no_deadline' : 'breached';
  }

  // Fallback for any unknown future status
  return 'no_deadline';
}

// ─── buildSlaDbFilter ─────────────────────────────────────────────────────────
// Returns a Prisma WHERE fragment to pre-filter orders by slaStatus.
// For `met` and `breached`, the filter is approximate (requires cross-field
// comparison); callers must apply an in-memory refinement pass with
// `computeSlaStatus` after the DB query.

export function buildSlaDbFilter(
  slaStatus: SlaStatus,
  now: Date,
): Record<string, unknown> {
  const atRiskThreshold = new Date(now.getTime() + SLA_AT_RISK_WINDOW_MS);
  const ACTIVE = ['new', 'assigned', 'picked_up'];

  switch (slaStatus) {
    case 'no_deadline':
      // Both active and terminal no-deadline orders, excluding cancelled (exempt)
      return { deadline: null, NOT: { status: 'cancelled' } };

    case 'on_track':
      return { status: { in: ACTIVE }, deadline: { gt: atRiskThreshold } };

    case 'at_risk':
      return { status: { in: ACTIVE }, deadline: { gt: now, lte: atRiskThreshold } };

    case 'overdue':
      return { status: { in: ACTIVE }, deadline: { lt: now } };

    case 'met':
      // Approximate: delivered with deadline set.
      // In-memory filter (computeSlaStatus) will remove breached rows.
      return { status: 'delivered', deadline: { not: null } };

    case 'breached':
      // Approximate: (delivered with deadline) OR (failed with deadline).
      // In-memory filter will remove met rows from the delivered subset.
      return {
        OR: [
          { status: 'delivered', deadline: { not: null } },
          { status: 'failed', deadline: { not: null } },
        ],
      };

    case 'exempt':
      return { status: 'cancelled' };
  }
}

// ─── computeSlaSummary ────────────────────────────────────────────────────────
// Aggregates slaStatus counts over a collection of orders.
// Returns a zero-filled SlaSummary when orders is empty.

export function computeSlaSummary(orders: SlaOrderInput[], now: Date = new Date()): SlaSummary {
  const summary: SlaSummary = {
    total: orders.length,
    no_deadline: 0,
    on_track: 0,
    at_risk: 0,
    overdue: 0,
    met: 0,
    breached: 0,
    exempt: 0,
  };

  for (const order of orders) {
    const s = computeSlaStatus(order, now);
    summary[s]++;
  }

  return summary;
}
