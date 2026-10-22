import { useQuery } from "@tanstack/react-query";

import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Service URL and mail settings; no `mail` means mail is not connected (ADR-0015, ADR-0017). */
export function useServiceSettings() {
  return useQuery<ServiceSettings, Error>({
    queryKey: QUERY_KEYS.admin.settings,
    queryFn: () => adminRepository.getSettings(),
    staleTime: 60 * 1000,
  });
}
