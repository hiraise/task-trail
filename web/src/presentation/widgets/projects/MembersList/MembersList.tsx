import { toast } from "sonner";

import styles from "./MembersList.module.css";

import { UserItem } from "./UserItem";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { PERMISSIONS, ProjectMember } from "@/domain/project/project.entity";
import { hasPermission } from "@/shared/utils/permissions";
import { useAppSelector } from "@/infrastructure/redux/hooks";

interface MembersListProps {
  members: ProjectMember[];
}

export function MembersList({ members }: MembersListProps) {
  const currentUserId = useAppSelector((s) => (s.user.data?.id ? Number(s.user.data.id) : null));
  const currentUser = members.find((m) => currentUserId && m.id === currentUserId);

  const handleOnClick = (id: number) => {
    toast.info(`User with ID ${id} clicked`);
  };

  const getMemberData = (user: ProjectMember) => {
    const isOwner = hasPermission(user.permissions, PERMISSIONS.PROJECT_OWNER);
    const isAdmin = hasPermission(user.permissions, PERMISSIONS.PROJECT_ADMIN);

    const showDeleteButton = () => {
      if (isOwner || isAdmin) return false;
      if (user.id === currentUserId) return false;
      if (currentUser?.permissions.includes(PERMISSIONS.PROJECT_KICK_USERS)) return true;
    };

    return {
      email: isOwner ? "Владелец проекта" : user.email,
      sortValue: isOwner ? 0 : isAdmin ? 1 : 2,
      showDeleteButton: showDeleteButton(),
    };
  };

  // Sort members: owners first, then admins, then regular users
  const sortedMembers = [...members].sort(
    (a, b) => getMemberData(a).sortValue - getMemberData(b).sortValue
  );

  return (
    <div className={styles.container}>
      {sortedMembers.map((user) => {
        const { email, showDeleteButton } = getMemberData(user);

        return (
          <div key={user.email} className={styles.userWrapper}>
            <UserItem username={user.username} email={email} />
            {showDeleteButton && (
              <IconButton
                icon={ICONS.delete}
                size="24px"
                onClick={() => handleOnClick(user.id)}
                color="rgba(0, 0, 0, 0.5)"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
