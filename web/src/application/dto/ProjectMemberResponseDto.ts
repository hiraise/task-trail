import type { ProjectMember } from "@/domain/models/ProjectMember";

export interface ProjectMemberResponseDto {
  id: string | number;
  email: string;
  username: string;
  role: string;
  displayName: string;

  // UI flags
  isOwner: boolean;
  isAdmin: boolean;
}

export class ProjectMemberResponseMapper {
  static fromDomain(member: ProjectMember): ProjectMemberResponseDto {
    return {
      id: member.id.value,
      email: member.email.toString(),
      username: member.username,
      role: member.getUserRoleLabel(),
      displayName: member.getDisplayName(),
      isOwner: member.isOwner(),
      isAdmin: member.isAdmin(),
    };
  }

  static fromDomainList(members: ProjectMember[]): ProjectMemberResponseDto[] {
    return members.map((member) => this.fromDomain(member));
  }
}
