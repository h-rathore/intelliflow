/**
 * IntelliFlow — General Utility Functions
 */

/**
 * Joins class name strings, filtering out falsy values.
 * Lightweight alternative to `clsx` for simple cases.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats an ISO date string to a human-readable local date.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
