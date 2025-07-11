import { useAppSelector } from "@/infrastructure/redux/hooks";
import { useCallback } from "react";

export type Permission = "owner" | "admin" | "member";

export const useProjectPermissions = (projectId: string) => {
  const user = useAppSelector((s) => s.user.data);
  const project = useAppSelector((s) =>
    s.projects.find((p) => p.id === projectId)
  );

  const getUserRole = (): Permission | null => {
    // if (!user || !project) return null;
    if (!user) return null;
    //TODO: Add role validation logic
    return "owner"; // Default to member for now, replace with actual logic
  };

  const userRole = getUserRole();

  const hasPermission = useCallback(
    (requiredPermission: Permission): boolean => {
      if (!userRole) return false;

      const permissionLevels = {
        member: 1,
        admin: 2,
        owner: 3,
      };

      const userLevel = permissionLevels[userRole];
      const requiredLevel = permissionLevels[requiredPermission];
      return userLevel >= requiredLevel;
    },
    [userRole]
  );

  return { hasPermission, userRole };
};
