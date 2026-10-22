import type { CurrentUser, User } from "@/domain/models/User";

import type { CurrentUser as CurrentUserDto, User as UserDto } from "../api/generated";
import { fileUrl } from "../config/apiRoutes";

// Ответы API приходят в типах из контракта (ADR-0020) и переводятся в модели domain здесь,
// без проверки схемой: форму ответов сервера проверяют его тесты по контракту (ADR-0019).

export const toUser = (dto: UserDto): User => ({
  id: dto.id,
  email: dto.email,
  username: dto.username,
  avatarUrl: dto.avatarId ? fileUrl(dto.avatarId) : undefined,
});

export const toCurrentUser = (dto: CurrentUserDto): CurrentUser => ({
  ...toUser(dto),
  isAdmin: dto.isAdmin,
});
