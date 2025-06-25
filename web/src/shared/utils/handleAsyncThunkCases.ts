import { ActionReducerMapBuilder, AsyncThunk } from "@reduxjs/toolkit";

import { AppErrorProps } from "@/shared/errors/types";

export function handleAsyncThunkCases<
  State extends { loading: boolean; error: string | null },
  Returned,
  ThunkArg
>(
  builder: ActionReducerMapBuilder<State>,
  thunk: AsyncThunk<Returned, ThunkArg, { rejectValue: AppErrorProps }>
) {
  builder
    .addCase(thunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(thunk.fulfilled, (state) => {
      state.loading = false;
    })
    .addCase(thunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || "Неизвестная ошибка";
    });
}
