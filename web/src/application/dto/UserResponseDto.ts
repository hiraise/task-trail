import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { User } from "@/domain/models/User";

export interface UserResponseDto {
  id: number;
  avatarUrl: string;
  username: string;
  email: string;
}

/**
 * Maps a User domain entity to a UserResponseDto.
 *
 * @param user - The User entity to be transformed
 * @returns A UserResponseDto object containing the user's id, username, email, and avatarUrl
 *
 * @example
 * ```typescript
 * const user: User = getUserById(123);
 * const userDto = mapUserToResponse(user);
 * ```
 */
export const mapUserToResponse = (user: User): UserResponseDto => {
  return {
    id: user.id.value as number,
    avatarUrl: user.avatarUrl ?? "",
    username: user.getDisplayName(),
    email: user.email,
  };
};

/**
 * Maps an array of User entities to an array of UserResponseDto objects.
 *
 * @param users - An array of User entities to be mapped
 * @returns An array of UserResponseDto objects containing the mapped user data
 *
 * @example
 * ```typescript
 * const users: User[] = [user1, user2];
 * const userDtos = mapUsersToResponse(users);
 * ```
 */
export const mapUsersToResponse = (users: User[]): UserResponseDto[] =>
  users.map((user) => mapUserToResponse(user));

/**
 * Maps a ProjectMember domain entity to a UserResponseDto.
 *
 * @param member - The ProjectMember entity to be transformed
 * @returns A UserResponseDto object containing the user's id, username, email, and avatarUrl
 *
 * @remarks
 * The avatarUrl field is currently set to an empty string and requires implementation.
 */
export const mapProjectMemberToResponse = (member: ProjectMember): UserResponseDto => {
  return {
    id: member.id.value,
    avatarUrl: "", //TODO: think about it
    username: member.username,
    email: member.email.toString(),
  };
};
