import { queryOptions, useQuery } from "@tanstack/react-query";

import { settingsRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Открыта ли регистрация и включена ли почта; маршруты читают то же через ensureQueryData. */
export const publicSettingsQuery = queryOptions({
  queryKey: QUERY_KEYS.settings.public,
  queryFn: () => settingsRepository.getPublic(),
  staleTime: 60 * 1000,
});

export function usePublicSettings() {
  return useQuery(publicSettingsQuery);
}
