import { toast } from "sonner";

import styles from "./MembersList.module.css";

import { UserItem } from "./UserItem";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { PERMISSIONS, ProjectMember } from "@/domain/project/project.entity";
import { useAppSelector } from "@/infrastructure/redux/hooks";

const showDeleteButton = (currentUser: ProjectMember, member: ProjectMember) => {
  if (member.isOwner || member.isAdmin) return false;
  if (member.id === currentUser.id) return false;
  if (currentUser?.permissions.includes(PERMISSIONS.PROJECT_KICK_USERS)) return true;
  return false;
};

// Sort members: owners first, then admins, then regular users
const getSortedMembers = (members: ProjectMember[]) => {
  return [...members].sort((a, b) => {
    const aPriority = a.isOwner ? 0 : a.isAdmin ? 1 : 2;
    const bPriority = b.isOwner ? 0 : b.isAdmin ? 1 : 2;
    return aPriority - bPriority;
  });
};

interface MembersListProps {
  members: ProjectMember[];
}

export function MembersList({ members }: MembersListProps) {
  const currentUserId = useAppSelector((s) => (s.user.data?.id ? Number(s.user.data.id) : null));
  const currentUser = members.find((m) => currentUserId && m.id === currentUserId);

  const handleOnClick = (id: number) => {
    toast.info(`User with ID ${id} clicked`);
  };

  const sortedMembers = getSortedMembers(members);

  return (
    <div className={styles.container}>
      {sortedMembers.map((user) => {
        return (
          <div key={user.email} className={styles.userWrapper}>
            <UserItem
              username={user.username}
              email={user.isOwner ? "Владелец проекта" : user.email}
            />
            {showDeleteButton(currentUser!, user) && (
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
