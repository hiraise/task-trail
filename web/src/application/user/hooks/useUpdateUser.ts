import { toast } from "sonner";

import { User } from "@/domain/user/types";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { updateUserThunk } from "../thunks/userThunks";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useUpdateUser = () => {
  const dispatch = useAppDispatch();

  const updateUser = async ({ data }: { data: Partial<User> }) => {
    try {
      await dispatch(updateUserThunk(data)).unwrap();
      toast.success("User updated successfully");
    } catch (error) {
      clientLogger.error("Update user error:", { error });
      toast.error("Failed to update user");
    }
  };

  return { updateUser };
};
