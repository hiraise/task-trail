import { useQuery } from "@tanstack/react-query";

import type { AdminUser } from "@/domain/models/AdminUser";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Все пользователи сервиса по дате регистрации, первые — раньше (ADR-0014). */
export function useAdminUsers() {
  return useQuery<AdminUser[], Error>({
    queryKey: QUERY_KEYS.admin.users,
    queryFn: () => adminRepository.findUsers(),
    staleTime: 60 * 1000,
  });
}
