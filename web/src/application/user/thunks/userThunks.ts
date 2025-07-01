import { userService } from "@/infrastructure/api/userService";
import { createGetCurrentUserThunk } from "./createGetCurrentUserThunk";
import { createUpdateUserThunk } from "./createUpdateUserThunk";

export const getCurrentUserThunk = createGetCurrentUserThunk(
  userService.getCurrentUser
);
export const updateUserThunk = createUpdateUserThunk(userService.updateUser);
