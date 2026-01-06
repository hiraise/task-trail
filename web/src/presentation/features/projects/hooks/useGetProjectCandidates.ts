import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import { appContainer } from "@/infrastructure/di/container";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export function useGetProjectCandidates(
  projectId?: string | number
): UseQueryResult<UserResponseDto[], Error> {
  const { getCandidates } = appContainer.getUsecases().project;

  return useQuery({
    queryKey: QUERY_KEYS.projectCandidates(Number(projectId)),
    queryFn: async () => getCandidates.execute(projectId),
  });
}
