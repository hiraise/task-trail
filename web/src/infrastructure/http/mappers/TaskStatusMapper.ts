import { TaskStatus } from "@/domain/valueobjects/TaskStatus";

import type { TaskStatusDTO } from "../dto/TaskDTO";

export class TaskStatusMapper {
  static toDomain(dto: TaskStatusDTO): TaskStatus {
    return new TaskStatus(dto.id, dto.name, dto.isDefault, dto.isResolved);
  }

  static toDomainList(dtos: TaskStatusDTO[]): TaskStatus[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  static toDTO(status: TaskStatus): TaskStatusDTO {
    return {
      id: status.id,
      name: status.name,
      isDefault: status.isDefault,
      isResolved: status.isResolved,
    };
  }
}
