import type { SearchResult } from "../models/SearchResult";

/** Search across what the current user sees (ADR-0030). */
export interface SearchRepository {
  /**
   * Case-insensitive substring in names, task descriptions and keys like DS-12.
   * `q` is 1–100 characters after trimming, otherwise VALIDATION_FAILED.
   */
  search(q: string): Promise<SearchResult>;
}
