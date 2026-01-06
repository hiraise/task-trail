import { Project } from "@/domain/models/Project";
import { Permission } from "@/domain/valueobjects/Permission";

import type { CreateProjectPayload, ProjectDTO, UpdateProjectPayload } from "../dto/ProjectDTO";

export class ProjectMapper {
  static toDomain(dto: ProjectDTO): Project {
    const permissions = dto.permissions ? dto.permissions.map(Permission.fromString) : [];
    return Project.fromBackendData(
      dto.id,
      dto.name,
      dto.description,
      dto.createdAt,
      permissions,
      dto.tasksCount
    );
  }

  static toDTO(project: Project): ProjectDTO {
    return {
      id: project.id.value as number,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      permissions: project.getPermissions().map((permission) => permission.toString()),
      tasksCount: project.tasksCount,
    };
  }

  static toDomainList(dtos: ProjectDTO[]): Project[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  static toCreatePayload(
    name: string,
    description?: string,
    participants?: string[]
  ): CreateProjectPayload {
    return {
      name,
      description,
      participants,
    };
  }

  static toUpdatePayload(name?: string, description?: string): UpdateProjectPayload {
    return {
      name,
      description,
    };
  }
}
