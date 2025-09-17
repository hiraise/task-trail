import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { User } from "@/domain/user/user.entity";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { userService } from "@/infrastructure/api/userService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<User>(QUERY_KEYS.currentUser);

  const update = useMutation<User | null, Error, Partial<User>>({
    mutationFn: userService.updateUser,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      clientLogger.error("Failed to update user", { error });
      toast.error("Failed to update user");
    },
  });

  return { user, update };
};
