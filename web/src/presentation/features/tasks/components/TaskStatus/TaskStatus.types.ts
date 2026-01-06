import type { TaskStatusResponseDto } from "@/application/dto/TaskStatusResponseDto";

export interface TaskStatusProps {
  onSelect: (value: TaskStatusResponseDto) => void;
  selectedStatus?: TaskStatusResponseDto;
}

export interface StatusOption {
  label: string;
  value: string;
}
