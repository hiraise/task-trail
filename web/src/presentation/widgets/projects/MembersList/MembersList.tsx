import { useState } from "react";
import { useParams } from "next/navigation";

import styles from "./MembersList.module.css";

import { UserItem } from "./UserItem";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { PERMISSIONS, ProjectMember } from "@/domain/project/project.entity";
import { Spinner } from "@/presentation/ui/Spinner";
import { useKickMember } from "@/application/projects/hooks/useProject";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";

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
  const { data: user } = useGetCurrentUser();
  const currentUser = members.find((m) => user && m.id === user.id);
  const projectId = Number(useParams().id);

  const { mutateAsync: kick, isPending: isLoading } = useKickMember(projectId);
  const [kickingUserId, setKickingUserId] = useState<number | null>(null);

  const handleOnClick = async (memberId: number) => {
    setKickingUserId(memberId);
    await kick(memberId);
    setKickingUserId(null);
  };

  const sortedMembers = getSortedMembers(members);

  return (
    <div className={styles.container}>
      {sortedMembers.map((user) => {
        return (
          <div key={user.id} className={styles.userWrapper}>
            <UserItem
              username={user.username}
              email={user.isOwner ? "Владелец проекта" : user.email}
            />
            {showDeleteButton(currentUser!, user) &&
              (isLoading && kickingUserId === user.id ? (
                <Spinner size={25} />
              ) : (
                <IconButton
                  icon={ICONS.delete}
                  size="24px"
                  onClick={() => handleOnClick(user.id)}
                  color="rgba(0, 0, 0, 0.5)"
                  disabled={isLoading}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
