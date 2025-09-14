import { useQuery } from "@tanstack/react-query";

import { userService } from "@/infrastructure/api/userService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useGetUserTasks = () => {
  return useQuery({
    queryKey: QUERY_KEYS.userTasks,
    queryFn: userService.getTasks,
    staleTime: 5 * 60 * 1000,
  });
};
