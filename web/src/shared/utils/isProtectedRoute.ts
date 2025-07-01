import { protectedRoutes } from "@/infrastructure/config/routes";

export function isProtectedRoute(pathName: string): boolean {
  return protectedRoutes.some((route) => pathName.startsWith(route));
}
