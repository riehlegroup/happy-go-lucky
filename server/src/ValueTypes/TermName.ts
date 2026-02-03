import { IllegalArgumentException } from '../Exceptions/IllegalArgumentException';

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
  private static readonly TERM_REGEX = /^(ws|winter|ss|summer)\s*(\d{2}|\d{4})(?:\s*\/\s*(\d{2}|\d{4}))?$/i;

  private readonly value: string;

  constructor(input: string) {
    const canonical = TermName.toCanonical(input);
    IllegalArgumentException.assert(Boolean(canonical), 'Invalid term name');
    this.value = canonical;
  }

  static toCanonical(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(TermName.TERM_REGEX);
    if (!match) {
      return '';
    }

    const rawPrefix = match[1].toLowerCase();
    const rawYear1 = match[2];
    const rawYear2 = match[3];

    const prefix = rawPrefix === 'ws' || rawPrefix === 'winter' ? 'WS' : 'SS';

    const year1 = TermName.normalizeYear4(rawYear1);
    if (!year1) {
      return '';
    }

    if (!rawYear2) {
      return `${prefix}${year1}`;
    }

    const year2 = TermName.normalizeYear2(rawYear2);
    if (!year2) {
      return '';
    }

    return `${prefix}${year1}/${year2}`;
  }

  private static normalizeYear4(year: string): string {
    if (/^\d{4}$/.test(year)) {
      return year;
    }
    if (/^\d{2}$/.test(year)) {
      return `20${year}`;
    }
    return '';
  }

  private static normalizeYear2(year: string): string {
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
