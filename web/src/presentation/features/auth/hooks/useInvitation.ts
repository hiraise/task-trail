import { useQuery } from "@tanstack/react-query";

import { authRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Куда ведёт ссылка приглашения. Ошибка с кодом `LINK_INVALID` — ссылка неверна или истекла,
 * `INVITATION_ACCEPTED` — аккаунт с этой почтой уже есть и нужно войти (lookupInvitation).
 */
export function useInvitation(token: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.auth.invitation(token ?? ""),
    queryFn: () => authRepository.lookupInvitation(token ?? ""),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}
