// Pure domain helpers for schematic labels.
// Kept dependency-free so they are trivially unit-testable (TDD).

export type PointType = "signal" | "station" | "crossing" | "milepost" | "ss";

/**
 * A signal label is a letter, then 1-4 digits, then optional trailing letters.
 * The real schematics range from 1 digit (E7B) to 4 digits (E1236, E1340).
 * Examples: E18LA, E1236, M571, O22RB, E7B, E13A.
 */
export const SIGNAL_PATTERN = /^[A-Z]\d{1,4}[A-Z]{0,2}$/;

export function isSignalLabel(label: string): boolean {
  return SIGNAL_PATTERN.test(label.trim());
}

/** A milepost is a bare 1-3 digit number shown in a pentagon. */
export function isMilepostLabel(label: string): boolean {
  return /^\d{1,3}$/.test(label.trim());
}

/**
 * Normalize a label for comparison: trim, collapse internal whitespace,
 * and uppercase. Used when scoring a learner's typed answer.
 */
export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").toUpperCase();
}

/** True when a learner's answer matches the expected label (case/space-insensitive). */
export function labelsMatch(answer: string, expected: string): boolean {
  return normalizeLabel(answer) === normalizeLabel(expected);
}
