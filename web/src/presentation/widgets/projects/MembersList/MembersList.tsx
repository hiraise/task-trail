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
import { TEXTS } from "@/shared/locales/texts";
import clsx from "clsx";

const showDeleteButton = (currentUser: ProjectMember | undefined, member: ProjectMember) => {
  if (member.isOwner || member.isAdmin) return false;
  if (currentUser && member.id === currentUser.id) return false;
  if (currentUser?.permissions.includes(PERMISSIONS.PROJECT_KICK_USERS)) return true;
  return false;
};

interface MembersListProps {
  group: "admins" | "members";
  members: ProjectMember[];
}

export function MembersList({ group, members }: MembersListProps) {
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

  let tag: string;

  switch (group) {
    case "admins":
      tag = TEXTS.projects.admins;
      break;

    case "members":
      tag = TEXTS.projects.members;
      break;
  }

  return (
    <div className={styles.container}>
      <div className={clsx(styles.tag, styles[group])}>
        <span className="caption-med">{tag}</span>
      </div>
      <ul>
        {members.map((user) => {
          return (
            <li key={user.id} className={styles.userWrapper}>
              <UserItem
                username={user.username}
                email={user.isOwner ? "Владелец проекта" : user.email}
              />
              {showDeleteButton(currentUser, user) &&
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
