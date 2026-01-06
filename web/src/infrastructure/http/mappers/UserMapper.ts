import { User } from "@/domain/models/User";

import type { UserDTO } from "../dto/UserDTO";

export class UserMapper {
  static toDomain(dto: UserDTO): User {
    return User.fromBackendData(dto.id, dto.avatarUrl, dto.username, dto.email);
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.id.value as number,
      avatarUrl: user.avatarUrl,
      username: user.username,
      email: user.email,
    };
  }

  static toDomainList(dtos: UserDTO[]): User[] {
    return dtos.map((dto) => this.toDomain(dto));
  }
}
