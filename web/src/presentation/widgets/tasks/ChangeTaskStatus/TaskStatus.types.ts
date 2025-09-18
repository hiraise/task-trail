import { TaskStatus } from "@/domain/task/task.entity";

export interface TaskStatusProps {
  onClose?: () => void;
  onSelect: (value: TaskStatus) => void;
  onApply?: () => void;
  selectedStatus?: TaskStatus;
}

export interface StatusOption {
  label: string;
  value: string;
}
