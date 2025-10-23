import { TaskStatus } from "@/domain/task/task.entity";

export interface TaskStatusProps {
  onSelect: (value: TaskStatus) => void;
  selectedStatus?: TaskStatus;
}

export interface StatusOption {
  label: string;
  value: string;
}
