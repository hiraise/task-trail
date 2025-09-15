/**
 * Removes trailing slashes from a string (e.g., URL path).
 */
export function normalize(str: string): string {
  return str.replace(/\/+$/, "");
}
import { format } from "date-fns";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}
