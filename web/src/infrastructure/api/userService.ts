import { AppError, AppErrorType } from "@/shared/errors/types";
import { clientLogger } from "../config/clientLogger";
import { mapUserFromApi } from "../mappers/userMapper";
import { GetCurrentUser } from "@/domain/user/types";

const getCurrentUser: GetCurrentUser = async () => {
  try {
    // Simulating an API call with a delay
    const userData = {
      id: "12",
      email: "timberlake@example.com",
      name: "Justin Timberlake",
    };
    const response = await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    ).then(() => userData);
    return mapUserFromApi(response);
  } catch (error) {
    clientLogger.error("Get current user error", { error: error });
    throw new AppError(AppErrorType.UNKNOWN, "Failed to get current user");
  }
};

export const userService = {
  getCurrentUser: getCurrentUser,
};
