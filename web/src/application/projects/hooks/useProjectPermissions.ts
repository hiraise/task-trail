import { useAppSelector } from "@/infrastructure/redux/hooks";

export type Permission = "owner" | "admin" | "member";

export const useProjectPermissions = () => {
  const user = useAppSelector((s) => s.user.data);
  const project = useAppSelector((s) => s.project.project);

  const getUserRole = (): Permission | null => {
    if (!user || !project) return null;
    if (!user) return null;
    //TODO: Add role validation logic
    return "owner";
  };

  const userRole = getUserRole();

  const hasPermission = (requiredPermission: Permission): boolean => {
    if (!userRole) return false;

    const permissionLevels = {
      member: 1,
      admin: 2,
      owner: 3,
    };

    const userLevel = permissionLevels[userRole];
    const requiredLevel = permissionLevels[requiredPermission];
    return userLevel >= requiredLevel;
  };

  return { hasPermission };
};
