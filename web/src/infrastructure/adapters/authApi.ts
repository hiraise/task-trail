import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { authService } from "@/infrastructure/api/authService";
import { ChangePasswordPayload } from "@/domain/auth/types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  }),

  endpoints: (build) => ({
    changePassword: build.mutation<null, ChangePasswordPayload>({
      queryFn: async (payload) => {
        await authService.changePassword(payload);
        return { data: null };
      },
    }),
  }),
});

export const { useChangePasswordMutation } = authApi;
