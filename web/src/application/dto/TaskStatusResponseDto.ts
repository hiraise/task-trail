import type { TaskStatus } from "@/domain/valueobjects/TaskStatus";

export interface TaskStatusResponseDto {
  id: string | number;
  name: string;
  isDefault: boolean;
  isResolved: boolean;
}

export class TaskStatusResponseMapper {
  static fromDomain(status: TaskStatus): TaskStatusResponseDto {
    return {
      id: status.id,
      name: status.name,
      isDefault: status.isDefault,
      isResolved: status.isResolved,
    };
  }

  static fromDomainList(statuses: TaskStatus[]): TaskStatusResponseDto[] {
    return statuses.map((status) => this.fromDomain(status));
  }
}
