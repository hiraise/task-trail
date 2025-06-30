import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { authService } from "@/infrastructure/api/authService";
import { userService } from "@/infrastructure/api/userService";
import { User } from "@/domain/user/types";
import { AuthPayload } from "@/domain/auth/types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),

  endpoints: (build) => ({
    checkAuthStatus: build.query<null, void>({
      queryFn: async () => {
        await authService.checkAuthStatus();
        return { data: null };
      },
    }),
    getCurrentUser: build.query<User | null, void>({
      queryFn: async () => {
        const user = await userService.getCurrentUser();
        return { data: user };
      },
    }),
    login: build.mutation<null, AuthPayload>({
      queryFn: async (payload) => {
        await authService.login(payload);
        return { data: null };
      },
    }),
  }),
});

export const {
  useCheckAuthStatusQuery,
  useGetCurrentUserQuery,
  useLoginMutation,
} = authApi;
