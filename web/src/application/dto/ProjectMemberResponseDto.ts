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

/**
 * Maps a ProjectMember domain entity to a ProjectMemberResponseDto.
 *
 * @param member - The ProjectMember domain entity to be mapped
 * @returns A ProjectMemberResponseDto containing the mapped member data with:
 *   - id: The string value of the member's ID
 *   - email: The member's email as a string
 *   - username: The member's username
 *   - role: The user role label
 *   - displayName: The member's display name
 *   - isOwner: Boolean indicating if the member is an owner
 *   - isAdmin: Boolean indicating if the member is an admin
 */
export const mapProjectMemberToResponse = (member: ProjectMember): ProjectMemberResponseDto => {
  return {
    id: member.id.value,
    email: member.email.toString(),
    username: member.username,
    role: member.getUserRoleLabel(),
    displayName: member.getDisplayName(),
    isOwner: member.isOwner(),
    isAdmin: member.isAdmin(),
  };
};

/**
 * Maps an array of ProjectMember entities to an array of ProjectMemberResponseDto objects.
 *
 * @param members - An array of ProjectMember entities to be transformed
 * @returns An array of ProjectMemberResponseDto objects corresponding to the input members
 *
 * @example
 * ```ts
 * const members: ProjectMember[] = [member1, member2];
 * const responseDtos = mapProjectMembersToResponse(members);
 * ```
 */
export const mapProjectMembersToResponse = (members: ProjectMember[]): ProjectMemberResponseDto[] =>
  members.map((member) => mapProjectMemberToResponse(member));
