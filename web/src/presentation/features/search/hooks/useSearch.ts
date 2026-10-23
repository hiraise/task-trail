import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { SearchResult } from "@/domain/models/SearchResult";
import { searchRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Search results for `q` (ADR-0030). Nothing is requested while `q` is blank: the server rejects
 * an empty query. The previous results stay on screen while the next ones load.
 */
export function useSearch(q: string) {
  const query = q.trim();

  return useQuery<SearchResult, Error>({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchRepository.search(query),
    enabled: query.length > 0,
    placeholderData: keepPreviousData,
  });
}
