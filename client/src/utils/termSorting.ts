/**
 * Term sorting utilities for client-side chronologic ordering of terms.
 * 
 * This module provides functions to sort an array of Term objects by their
 * academic semester and year (e.g. "SS24", "WS24") in a chronological order.
 * Sorting can be done either from oldest to newest or newest to oldest.
 * 
 * Usage: 
 *  import { sortTermsChronologically, TermSortDirection } from './termSorting';
 * 
 *  const sortedTerms = sortTermsChronologically(terms, TermSortDirection.OLD_TO_NEW);
 * 
 * Exports:
 * - TermSortDirection: Constants for specifying sorting direction.
 *  - TermSortDirection.OLD_TO_NEW: Sort from oldest to newest.
 *  - TermSortDirection.NEW_TO_OLD: Sort from newest to oldest.
 * 
 * - sortTermsChronologically(terms, direction): Returns a new array of terms
 *   sorted according to the specified direction. The original array is not mutated.
 */


import { Term } from "@/components/Administration/Term/types";

export const TermSortDirection = {
    OLD_TO_NEW: "oldToNew",
    NEW_TO_OLD: "newToOld",
} as const;

export type TermSortDirection = (typeof TermSortDirection)[keyof typeof TermSortDirection];

type ParsedTerm = {
    semester: "SS" | "WS";
    year: number;
};

/**
 * Parses the term names into semester (string) and year (number) components. E.g. termName = "WS24" returns {semester: "WS", year: 2024}
 * Supported formats:
 * - SS24, WS24
 * - WS24/25
 * - Winter 2024, Summer 2025
 * @param termName Term to be parsed
 * @returns Parsed term consisting of semester and year components, or null if parsing fails.
 */
function parseTerm(termName: string): ParsedTerm | null {
if (!termName) return null;

const cleaned = termName.trim().toLowerCase();
const regex = /^(ws|winter|ss|summer)\s*(?:(\d{2}|\d{4})(?:\/(\d{2}))?)$/;
const match = cleaned.match(regex);

if (!match) return null;

let [_, sem, yearStr] = match;

let semester: "SS" | "WS" = (sem.includes("summer") || sem.includes("ss")) ? "SS" : "WS"
let year: number = parseInt(yearStr.length === 2 ? "20" + yearStr : yearStr, 10)    // assume 21st century

return {
    semester: semester,
    year: year
};
}

/**
 * Compares terms with respect to chronological ordering.
 * The year component is compared first and the semester component second.
 * For use inside sorting functions.
 * @param a Term a to be compared against b
 * @param b Term b to be compared against a
 * @param oldToNew (optional) Specifies whether terms should be sorted from old to new or vice versa.
 * Default is sorting from newest to oldest terms (i.e. oldToNew = false).
 * @returns -1 if term a comes before b,
 *          1 if term a comes after b, and
 *          0 if both terms are equal.
 */
function compareTerms(a: string, b: string, oldToNew: boolean = false): number {
const ta = parseTerm(a);
const tb = parseTerm(b);

if (!ta || !tb) return 0;       // Perform no sorting if error during parsing

if (ta.year !== tb.year) {
    // For oldToNew, earlier years come before newer ones
    // For newToOld, newer years come before earlier ones
    if (ta.year < tb.year) {
    return oldToNew ? -1 : 1;
    } else {
    return oldToNew ? 1 : -1;
    }
}

// Years are equal, compare semesters
if (ta.semester !== tb.semester) {
    // Parsed semesters are either SS or WS, so if for example ta.semester === "SS", then implicitly tb.semester === "WS" 
    if (oldToNew) {
        // For oldToNew, SS comes before WS in the same year
        return ta.semester === "SS" ? -1 : 1;
    } else {
        // For newToOld, SS comes after WS in the same year
        return ta.semester === "SS" ? 1 : -1;
    }    
}

// Same year, same semester => equal
return 0;
}

/**
 * Sorts terms chronologically, either from oldest to newest or newest to oldest.
 * @param terms Array of terms to be sorted. Is cloned internally to avoid in-place mutation.
 * @param direction Value indicating sorting order. 
 * Possible values: TermSortDirection.OLD_TO_NEW | TermSortDirection.NEW_TO_OLD
 * @returns Term array chronologically sorted in the desired direction.
 */
export function sortTermsChronologically(terms: Term[], direction: TermSortDirection = TermSortDirection.NEW_TO_OLD): Term[] {
const oldToNew = direction == TermSortDirection.OLD_TO_NEW;
return [...terms].sort((a, b) => compareTerms(a.termName, b.termName, oldToNew));
}

// Export internals for testing
export const _internals = { parseTerm, compareTerms };
