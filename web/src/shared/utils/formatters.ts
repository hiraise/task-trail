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

const FILE_SIZE_UNITS = ["Б", "КБ", "МБ", "ГБ"];

/**
 * A file size in Russian units, like 512 B, 2.4 KB, 312 KB, 2.4 MB with a decimal comma (artboard B
 * of stage 3). One decimal below 100, none from 100 and for bytes; a non-breaking space keeps
 * the number with its unit.
 */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;

  while (unit < FILE_SIZE_UNITS.length - 1 && Math.round(value * 10) / 10 >= 1024) {
    value /= 1024;
    unit += 1;
  }

  const digits = unit === 0 || value >= 99.95 ? 0 : 1;
  const number = value.toFixed(digits).replace(".", ",");

  return `${number}\u00a0${FILE_SIZE_UNITS[unit]}`;
}
