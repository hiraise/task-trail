import { useQuery } from "@tanstack/react-query";

import { getDisplayName } from "@/shared/utils/getDisplayName";
import { User } from "@/domain/user/user.entity";
import { userService } from "@/infrastructure/api/userService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useGetAssignee = (id: number | undefined) => {
  return useQuery({
    queryKey: id ? QUERY_KEYS.user(id) : ["user", "undefined"],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
    select: (data: User | null) => {
      if (!data) return;
      return {
        id: data.id,
        username: getDisplayName(data),
        avatarUrl: data.avatarUrl,
      };
    },
  });
};
