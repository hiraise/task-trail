import { API_ROUTES } from "../config/apiRoutes";
import { axiosClient } from "./axiosClient";
import { LoginPayload, LoginResponse } from "@/application/auth/types/types";

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.get(API_ROUTES.LOGIN);
      console.log("Response from server:", response.data);

      return {
        token: "fake-token-from-cat-api",
        user: {
          id: "1",
          email: payload.email,
          name: response.data.fact.slice(0, 20), // берём кусок текста как имя
        },
      };
    } catch (error) {
      console.error("Ошибка при получении данных с сервера", error);
      throw new Error("Ошибка при получении данных с сервера");
    }
  },
  signUp: async (payload: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.post(API_ROUTES.SIGNUP, payload);
      console.log("Response from server:", response.data);

      return {
        token: "fake-token",
        user: {
          id: "1",
          email: payload.email,
          name: response.data.fact.slice(0, 20), // берём кусок текста как имя
        },
      };
    } catch (error) {
      console.error("Ошибка при получении данных с сервера", error);
      throw new Error("Ошибка при получении данных с сервера");
    }
  },
};
