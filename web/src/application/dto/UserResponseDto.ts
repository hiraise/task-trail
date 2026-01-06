import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { User } from "@/domain/models/User";

export interface UserResponseDto {
  id: number;
  avatarUrl: string;
  username: string;
  email: string;
}

export class UserResponseMapper {
  static fromDomain(user: User): UserResponseDto {
    return {
      id: user.id.value as number,
      avatarUrl: user.avatarUrl ?? "",
      username: user.getDisplayName(),
      email: user.email,
    };
  }

  static fromDomainList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromDomain(user));
  }

  static fromProjectMember(member: ProjectMember): UserResponseDto {
    return {
      id: member.id.value,
      avatarUrl: "", //TODO: think about it
      username: member.username,
      email: member.email.toString(),
    };
  }
}
