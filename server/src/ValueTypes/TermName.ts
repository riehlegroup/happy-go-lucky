import { IllegalArgumentException } from '../Exceptions/IllegalArgumentException';

export type TermNameParseResult =
  | { ok: true; value: TermName; wasLegacy: boolean }
  | { ok: false; reason: 'invalid' };

/**
 * TermName value type.
 *
 * Canonical forms:
 * - WS2024
 * - SS2025
 * - WS2024/25
 * - SS2025/26
 *
 * Accepted inputs include (case-insensitive):
 * - WS24, WS2024, WS24/25, WS2024/25
 * - Winter 2024, Winter2024, Winter 2024/25
 * - SS25, SS2025, SS25/26, SS2025/26
 * - Summer 2025, Summer2025, Summer 2025/26
 */
export class TermName {
  // Accepts common term name inputs like:
  // - WS24, WS2024, Winter 2024
  // - WS24/25, Winter 2024/2025
  // - SS25, Summer2025, SS2025/26
  // Note: chronological correctness of ranges is validated in code after matching.
  private static readonly TERM_REGEX = /^(ws|winter|ss|summer)\s*(\d{2}|\d{4})(?:\s*\/\s*(\d{2}|\d{4}))?$/i;

  private readonly value: string;

  /**
   * Creates a TermName.
   *
   * By default this enforces the current strict validation rules.
   *
   * The `allowLegacy` option exists for reading old persisted data that may
   * not conform to newer rules (e.g. older versions accepted illogical year
   * ranges like "WS2025/24"). Avoid using this for user input.
   */
  constructor(input: string, options?: { allowLegacy?: boolean }) {
    const canonical = TermName.canonicalize(input);
    if (canonical) {
      this.value = canonical;
      return;
    }

    if (options?.allowLegacy) {
      const legacyCanonical = TermName.canonicalizeLegacy(input);
      IllegalArgumentException.assert(Boolean(legacyCanonical), 'Invalid term name');
      this.value = legacyCanonical;
      return;
    }

    IllegalArgumentException.assert(false, 'Invalid term name');
    this.value = '';
  }

  /**
   * Parse a string into a TermName (throws on invalid input).
   *
   * Naming rationale: callers shouldn't need to care whether we store
   * canonical values internally; they just want to construct from input.
   */
  static fromString(input: string): TermName {
    return new TermName(input);
  }

  /**
   * Non-throwing parsing helper.
   *
   * Prefer this at deserialization boundaries (e.g. reading from the DB)
   * where invalid/legacy persisted data should not crash the request.
   *
   * Parsing behavior:
   * - First tries strict canonicalization.
   * - If that fails, tries legacy canonicalization (range chronology not enforced).
   */
  static tryFromString(input: string): TermNameParseResult {
    const strictCanonical = TermName.canonicalize(input);
    if (strictCanonical) {
      return {
        ok: true,
        value: new TermName(strictCanonical),
        wasLegacy: false,
      };
    }

    const legacyCanonical = TermName.canonicalizeLegacy(input);
    if (legacyCanonical) {
      return {
        ok: true,
        value: new TermName(legacyCanonical, { allowLegacy: true }),
        wasLegacy: true,
      };
    }

    return { ok: false, reason: 'invalid' };
  }

  private static canonicalize(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(TermName.TERM_REGEX);
    if (!match) {
      return '';
    }

    const rawPrefix = match[1].toLowerCase();
    const rawYear1 = match[2];
    const rawYear2 = match[3];

    const prefix = rawPrefix === 'ws' || rawPrefix === 'winter' ? 'WS' : 'SS';

    const year1 = TermName.normalizeYear4Digits(rawYear1);
    if (!year1) {
      return '';
    }

    if (!rawYear2) {
      return `${prefix}${year1}`;
    }

    const year2 = TermName.normalizeYear2Digits(rawYear2);
    if (!year2) {
      return '';
    }

    // Prevent accepting illogical ranges like "WS2025/24".
    // Canonically, the second year must be the year immediately after the first.
    const expectedYear2 = TermName.expectedNextYear2Digits(year1);
    if (!expectedYear2 || year2 !== expectedYear2) {
      return '';
    }

    return `${prefix}${year1}/${year2}`;
  }

  /**
   * Legacy canonicalization: matches the same input formats as `toCanonical`
   * but does NOT enforce that year ranges are chronological.
   *
   * This is only intended as a compatibility layer when reading existing
   * persisted data created before stricter validation was enforced.
   */
  private static canonicalizeLegacy(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(TermName.TERM_REGEX);
    if (!match) {
      return '';
    }

    const rawPrefix = match[1].toLowerCase();
    const rawYear1 = match[2];
    const rawYear2 = match[3];

    const prefix = rawPrefix === 'ws' || rawPrefix === 'winter' ? 'WS' : 'SS';

    const year1 = TermName.normalizeYear4Digits(rawYear1);
    if (!year1) {
      return '';
    }

    if (!rawYear2) {
      return `${prefix}${year1}`;
    }

    const year2 = TermName.normalizeYear2Digits(rawYear2);
    if (!year2) {
      return '';
    }

    return `${prefix}${year1}/${year2}`;
  }

  /**
   * For canonical term ranges we expect the second year to be the *next* year.
   * Example: 2024 -> "25"; 2099 -> "00" (rollover to 2100).
   */
  private static expectedNextYear2Digits(year4: string): string {
    if (!/^\d{4}$/.test(year4)) {
      return '';
    }
    const year = Number.parseInt(year4, 10);
    if (!Number.isFinite(year)) {
      return '';
    }
    return String((year + 1) % 100).padStart(2, '0');
  }

  private static normalizeYear4Digits(year: string): string {
    if (/^\d{4}$/.test(year)) {
      return year;
    }
    if (/^\d{2}$/.test(year)) {
      // Note: 2-digit years are interpreted as 2000-2099.
      // For years >= 2100, users must enter the 4-digit year explicitly (e.g. "WS2100").
      return `20${year}`;
    }
    return '';
  }

  private static normalizeYear2Digits(year: string): string {
    if (/^\d{2}$/.test(year)) {
      return year;
    }
    if (/^\d{4}$/.test(year)) {
      return year.slice(2);
    }
    return '';
  }

  toString(): string {
    return this.value;
  }

  equals(other: TermName): boolean {
    return this.toString() === other.toString();
  }
}
