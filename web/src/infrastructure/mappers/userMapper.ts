import { User } from "@/domain/user/types";

interface ApiUser {
  id: string | number;
  email: string;
  full_name?: string;
  name?: string;
}

export function mapUserFromApi(data: ApiUser): User {
  return {
    id: String(data.id),
    email: data.email,
    name: data.full_name ?? data.name ?? "",
  };
}

export function mapUserToApi(user: User): ApiUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.name,
  };
}
