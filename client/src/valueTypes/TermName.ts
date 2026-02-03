export type TermName = string & { readonly __brand: 'TermName' };

export type TermNameParseResult =
  | { ok: true; value: TermName }
  | { ok: false; error: string };

const TERM_REGEX = /^(ws|winter|ss|summer)\s*(\d{2}|\d{4})(?:\s*\/\s*(\d{2}|\d{4}))?$/i;

function normalizeYear4(year: string): string {
  if (/^\d{4}$/.test(year)) return year;
  if (/^\d{2}$/.test(year)) return `20${year}`;
  return "";
}

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

  return { ok: true, value: `${prefix}${year1}/${year2}` as TermName };
}

export function isTermName(value: string): value is TermName {
  return parseTermName(value).ok;
}
