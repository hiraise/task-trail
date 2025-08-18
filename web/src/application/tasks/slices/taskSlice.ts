import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Task } from "@/domain/task/task.entity";

type TaskState = Task | null;

const initialState: TaskState = null;

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTask: (state, action) => {
      return action.payload;
    },
    clearTask: () => {
      return null;
    },
    update: (state, action: PayloadAction<Partial<Task>>) => {
      if (state) {
        Object.assign(state as Task, action.payload);
      }
    },
  },
});

export const { setTask, clearTask, update } = taskSlice.actions;
export default taskSlice.reducer;
