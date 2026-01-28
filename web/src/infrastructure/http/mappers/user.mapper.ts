import { User } from "@/domain/models/User";

import type { UserDTO } from "../dto/UserDTO";

/**
 * Maps a UserDTO received from the API to a domain User instance.
 *
 * @param dto - The data transfer object returned by the backend.
 * @returns A User domain entity created from the backend data.
 */
export const mapApiUserToDomain = (dto: UserDTO): User => {
  return User.fromBackendData(dto.id, dto.avatarUrl, dto.username, dto.email);
};

/**
 * Maps an array of API user DTOs to domain user models.
 *
 * @param dtos - The list of user DTOs received from the API.
 * @returns The corresponding list of domain user objects.
 */
export const mapApiUsersToDomain = (dtos: UserDTO[]): User[] =>
  dtos.map((dto) => mapApiUserToDomain(dto));
