import { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/valueobjects/ProjectId";

import type { ProjectMemberDTO } from "../dto/ProjectMemberDTO";

export class ProjectMemberMapper {
  static toDomain(dto: ProjectMemberDTO, projectId: ProjectId): ProjectMember {
    return ProjectMember.fromBackendData(
      dto.id,
      projectId.value,
      dto.email,
      dto.username,
      dto.permissions,
    );
  }

  static toDomainList(dtos: ProjectMemberDTO[], projectId: ProjectId): ProjectMember[] {
    return dtos.map((dto) => this.toDomain(dto, projectId));
  }

  static toDTO(member: ProjectMember): ProjectMemberDTO {
    const permissions = member.getPermissions().map((permission) => permission.toString());
    return {
      id: member.id.value,
      email: member.email.toString(),
      username: member.username,
      permissions: permissions,
    };
  }
}
