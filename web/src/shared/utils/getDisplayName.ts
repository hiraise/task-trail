import { User } from "@/domain/user/types";
import { sharedTexts } from "../locales/sharedTexts";

export function getDisplayName(user?: User | null): string {
  if (!user) return sharedTexts.guest;
  if (user.name && user.name.trim()) return user.name;
  if (user.email) return user.email.split("@")[0];
  return sharedTexts.guest;
}
