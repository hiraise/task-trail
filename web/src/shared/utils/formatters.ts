import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

/**
 * Formats a given date as a string in the "dd.MM.yyyy" format.
 *
 * @param date - The date to format, either as a `Date` object or an ISO date string.
 * @returns The formatted date string in "dd.MM.yyyy" format.
 */
export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

/**
 * Formats a given number of seconds into a string in "MM:SS" format.
 *
 * @param secondsLeft - The total number of seconds to format.
 * @returns A string representing the time in minutes and seconds, zero-padded if necessary.
 *
 * @example
 * ```typescript
 * formatTime(75); // "1:15"
 * formatTime(5);  // "0:05"
 * ```
 */
export function formatTime(secondsLeft: number) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Removes trailing forward slashes from the end of a string.
 *
 * @param str - The input string to normalize.
 * @returns The input string without any trailing forward slashes.
 */
export function normalize(str: string): string {
  return str.replace(/\/+$/, "");
}

/** Date and time in Russian, like "October 23, 14:30" — link expiry and similar. */
export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d MMMM, HH:mm", { locale: ru });
}
