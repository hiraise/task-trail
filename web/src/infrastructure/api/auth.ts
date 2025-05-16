import { API_ROUTES } from "../config/apiRoutes";

import axiosClient from "./axiosClient";
import { AuthPayload } from "@/application/auth/types/types";
import { Domain, mapHttpError } from "@/shared/errors/mapHttpError";

export const authService = {
  login: async (payload: AuthPayload): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.LOGIN, payload);
    } catch (error) {
      // Rethrow the error to maintain the return type contract
      throw mapHttpError(error, Domain.AUTH);
    }
  },
  signUp: async (payload: AuthPayload): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.SIGNUP, payload);
    } catch (error) {
      // Rethrow the error to maintain the return type contract
      throw mapHttpError(error, Domain.AUTH);
    }
  },
};
