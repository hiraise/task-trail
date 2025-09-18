import { User } from "@/domain/user/user.entity";

export function getDisplayName(user?: User | null): string {
  if (!user) return "";
  if (user.username && user.username.trim()) return user.username;
  return user.email.split("@")[0];
}
