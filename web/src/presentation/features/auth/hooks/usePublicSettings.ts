import { queryOptions, useQuery } from "@tanstack/react-query";

import { settingsRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Whether registration is open and mail is enabled; routes read the same via ensureQueryData. */
export const publicSettingsQuery = queryOptions({
  queryKey: QUERY_KEYS.settings.public,
  queryFn: () => settingsRepository.getPublic(),
  staleTime: 60 * 1000,
});

export function usePublicSettings() {
  return useQuery(publicSettingsQuery);
}
