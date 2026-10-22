import { useQuery } from "@tanstack/react-query";

import { authRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Where an invitation link leads. Error code `LINK_INVALID`: the link is wrong or expired;
 * `INVITATION_ACCEPTED`: an account with this email already exists and must sign in (lookupInvitation).
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
