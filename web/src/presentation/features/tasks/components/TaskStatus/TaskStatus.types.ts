import type { TaskStatus } from "@/domain/models/TaskStatus";

export interface TaskStatusProps {
  onSelect: (value: TaskStatus) => void;
  selectedStatus?: TaskStatus;
}

export interface StatusOption {
  label: string;
  value: string;
}
