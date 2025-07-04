import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";

type SheetType =
  | typeof MODAL_TYPES.CREATE_PROJECT
  | typeof MODAL_TYPES.INVITE_USER
  | null;

interface SheetState {
  stack: { type: SheetType; props?: unknown }[];
}

const initialState: SheetState = {
  stack: [],
};

const bottomSheetSlice = createSlice({
  name: "bottomSheet",
  initialState,
  reducers: {
    openSheet: (
      state,
      action: PayloadAction<{ type: SheetType; props?: unknown }>
    ) => {
      state.stack.push({
        type: action.payload.type,
        props: action.payload.props || {},
      });
    },
    closeAllSheets: (state) => {
      state.stack = [];
    },
    backSheet: (state) => {
      state.stack.pop();
    },
  },
});

export const { openSheet, closeAllSheets, backSheet } =
  bottomSheetSlice.actions;
export default bottomSheetSlice.reducer;
