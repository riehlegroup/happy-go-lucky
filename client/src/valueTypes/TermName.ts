export type TermName = string & { readonly __brand: 'TermName' };

export type TermNameParseResult =
  | { ok: true; value: TermName }
  | { ok: false; error: string };

// Accepts common term name inputs like:
// - WS24, WS2024, Winter 2024
// - WS24/25, Winter 2024/2025
// - SS25, Summer2025, SS2025/26
// Note: chronological correctness of ranges is validated after the regex match.
const TERM_REGEX = /^(ws|winter|ss|summer)\s*(\d{2}|\d{4})(?:\s*\/\s*(\d{2}|\d{4}))?$/i;

/**
 * For canonical term ranges we expect the second year to be the *next* year.
 * Example: 2024 -> "25"; 2099 -> "00" (rollover to 2100).
 */
function expectedNextYear2(year4: string): string {
  if (!/^\d{4}$/.test(year4)) return "";
  const year = Number.parseInt(year4, 10);
  if (!Number.isFinite(year)) return "";
  return String((year + 1) % 100).padStart(2, "0");
}

/**
 * Normalize a year token into a 4-digit year.
 * - "24"   -> "2024"
 * - "2024" -> "2024"
 *
 * Note: 2-digit years are interpreted as 2000-2099.
 * For years >= 2100, users must enter the 4-digit year explicitly (e.g. "WS2100").
 */
function normalizeYear4(year: string): string {
  if (/^\d{4}$/.test(year)) return year;
  if (/^\d{2}$/.test(year)) return `20${year}`;
  return "";
}

/**
 * Normalize a year token into a 2-digit year suffix.
 * - "25"   -> "25"
 * - "2025" -> "25"
 */
function normalizeYear2(year: string): string {
  if (/^\d{2}$/.test(year)) return year;
  if (/^\d{4}$/.test(year)) return year.slice(2);
  return "";
}

export function parseTermName(input: string): TermNameParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Term name is required" };
  }

  const match = trimmed.match(TERM_REGEX);
  if (!match) {
    return {
      ok: false,
      error: "Use format: WS24, SS25, WS24/25, Winter 2024 or Summer 2025",
    };
  }

  const rawPrefix = match[1].toLowerCase();
  const rawYear1 = match[2];
  const rawYear2 = match[3];

  const prefix = rawPrefix === "ws" || rawPrefix === "winter" ? "WS" : "SS";
  const year1 = normalizeYear4(rawYear1);
  if (!year1) {
    return { ok: false, error: "Invalid year" };
  }

  if (!rawYear2) {
    return { ok: true, value: `${prefix}${year1}` as TermName };
  }

  const year2 = normalizeYear2(rawYear2);
  if (!year2) {
    return { ok: false, error: "Invalid year range" };
  }

  // Prevent accepting illogical ranges like "WS2025/24".
  // Canonically, the second year must be the year immediately after the first.
  const expectedYear2 = expectedNextYear2(year1);
  if (!expectedYear2 || year2 !== expectedYear2) {
    return {
      ok: false,
      error: `Invalid year range: expected ${expectedYear2} after ${year1}`,
    };
  }

  return { ok: true, value: `${prefix}${year1}/${year2}` as TermName };
}

export function isTermName(value: string): value is TermName {
  return parseTermName(value).ok;
}
