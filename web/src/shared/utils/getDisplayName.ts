import { User } from "@/domain/user/user.entity";
import { sharedTexts } from "../locales/sharedTexts";

export function getDisplayName(user?: User | null): string {
  if (!user) return sharedTexts.guest;
  if (user.username && user.username.trim()) return user.username;
  if (user.email) return user.email.split("@")[0];
  return sharedTexts.guest;
}
