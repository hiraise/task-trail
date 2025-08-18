import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Task, TaskStatus } from "@/domain/task/task.entity";

export interface TaskState {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  assigneeId?: number;
}

const initialState: TaskState = {} as TaskState;

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTask: (state, action) => {
      return action.payload;
    },
    clearTask: () => {
      return {} as TaskState;
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
