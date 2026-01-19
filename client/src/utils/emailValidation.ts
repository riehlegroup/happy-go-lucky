/**
 * Email validation utilities for client-side form validation.
 *
 * IMPORTANT: The validation regex must match server-side validation
 * in server/src/ValueTypes/Email.ts to ensure consistency.
 */

import { en as messages } from "@/messages";

/**
 * Validates email format using regex pattern.
 * Valid email format: local@domain.tld
 *
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates email and throws an error if invalid.
 * Useful for form submission validation.
 *
 * @param email - Email string to validate
 * @throws Error if email format is invalid
 */
export function validateEmailOrThrow(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error(messages.email.invalidNoPeriod);
  }
}
