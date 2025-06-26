import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapUserFromApi } from "../mappers/userMapper";
import { GetCurrentUser, UploadAvatar, UserService } from "@/domain/user/types";
import { mapAvatarFromApi } from "../mappers/avatarMapper";

const getCurrentUser: GetCurrentUser = async () => {
  try {
    const response = await axiosClient.get(API_ROUTES.CURRENT_USER);
    return mapUserFromApi(response.data);
  } catch (error) {
    clientLogger.error("Get current user error", { error: error });
    throw new AppError(AppErrorType.UNKNOWN, "Failed to get current user");
  }
};

const uploadAvatar: UploadAvatar = async (data: FormData) => {
  try {
    const response = await axiosClient.patch(API_ROUTES.UPLOAD_AVATAR, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapAvatarFromApi(response.data);
  } catch (error) {
    clientLogger.error("Upload avatar error", { error });
    throw new AppError(AppErrorType.UNKNOWN, "Failed to upload avatar");
  }
};

export const userService: UserService = {
  getCurrentUser: getCurrentUser,
  uploadAvatar: uploadAvatar,
};
