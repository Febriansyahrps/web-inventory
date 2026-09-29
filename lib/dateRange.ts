// lib/dateRange.ts — shared created_at range resolver.
//
// Used by /api/product (short presets) and /api/generate-report ("this_*").
// Both accept the same three presets plus an explicit custom range.

export interface ResolvedDateRange {
  gte?: Date;
  lte?: Date;
}

/**
 * Resolve a `range_date` preset (plus optional custom start/end) into a
 * `created_at` window.
 *
 * Accepts both the short presets used by /api/product
 * (`week` | `month` | `year` | `custom`) and the `this_*` aliases documented
 * for /api/generate-report (`this_week` | `this_month` | `this_year`).
 *
 * - `week` / `this_week`   → Monday–Sunday of the week containing `now`
 * - `month` / `this_month` → 1st → last day of the current month
 * - `year` / `this_year`   → Jan 1 → `now` within the current year
 * - `custom`               → `start_date` (00:00:00.000) → `end_date` (23:59:59.999)
 *
 * A custom range is also applied when no preset is given but a start or end
 * date is present, so a caller may omit `range_date` entirely.
 *
 * Returns `{}` when nothing applies, so callers can skip the filter.
 */
export function resolveDateRange(
  rangeDate?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  now: Date = new Date(),
): ResolvedDateRange {
  // Normalize "this_week" -> "week" so both callers share one code path.
  const preset = rangeDate?.trim().replace(/^this_/, "") || "";

  switch (preset) {
    case "week": {
      const day = now.getDay(); // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7; // days since Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { gte: monday, lte: sunday };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return { gte: first, lte: last };
    }
    case "year": {
      const first = new Date(now.getFullYear(), 0, 1);
      const last = new Date(now);
      last.setHours(23, 59, 59, 999);
      return { gte: first, lte: last };
    }
    case "custom":
      return resolveCustomRange(startDate, endDate);
    default:
      // No preset: fall back to a custom range when explicit dates were sent.
      return startDate || endDate
        ? resolveCustomRange(startDate, endDate)
        : {};
  }
}

function resolveCustomRange(
  startDate?: string | null,
  endDate?: string | null,
): ResolvedDateRange {
  const range: ResolvedDateRange = {};

  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      range.gte = d;
    }
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
  }

  return range;
}
