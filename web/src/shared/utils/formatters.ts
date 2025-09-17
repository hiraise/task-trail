import { format } from "date-fns";

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
 * Removes trailing forward slashes from the end of a string.
 *
 * @param str - The input string to normalize.
 * @returns The input string without any trailing forward slashes.
 */
export function normalize(str: string): string {
  return str.replace(/\/+$/, "");
}

/**
 * Returns a project ID based on the project name.
 * If the name contains multiple words (split by space, dash, underscore, or dot),
 * returns the first letter of the first two words.
 * If the name is a single word, returns the first two letters.
 *
 * @param str - The project name.
 * @returns The generated project ID.
 */
export function getProjectId(str: string): string {
  // Split by space, dash, underscore, or dot
  let res: string;
  const words = str
    .trim()
    .split(/[\s\-_\.]+/)
    .filter(Boolean);
  if (words.length === 1) {
    res = words[0].slice(0, 2).toUpperCase();
  } else {
    res = (words[0][0] + words[1][0]).toUpperCase();
  }
  return `${res}-`;
}

/**
 * Returns the initials of a user's name from a given string.
 *
 * - If the input contains only one word, returns the first two letters of that word in uppercase.
 * - If the input contains multiple words, returns the first letter of the first two words in uppercase.
 *
 * @param str - The input string representing the user's name.
 * @returns The computed initials in uppercase.
 */
export function getUserInitials(str: string): string {
  let res: string;
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    res = words[0].slice(0, 2).toUpperCase();
  } else {
    res = (words[0][0] + words[1][0]).toUpperCase();
  }
  return res;
}
