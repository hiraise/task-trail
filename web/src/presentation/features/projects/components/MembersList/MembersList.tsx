import clsx from "clsx";
import { useParams } from "next/navigation";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import { UserItem } from "@/presentation/shared";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./MembersList.module.css";

interface MembersListProps {
  group: "admins" | "members";
  members: ProjectMemberResponseDto[];
}

export function MembersList({ group, members }: MembersListProps) {
  const projectId = Number(useParams().id);
  const { data: currentUser } = useGetCurrentUser();
  const { showMemberActions } = useGlobalModals();

  if (!currentUser) return null;

  const handleOnClick = async (user: ProjectMemberResponseDto) => {
    const data = {
      memberId: Number(user.id),
      memberDisplayName: user.username,
      currentUserId: currentUser?.id ?? -1,
      projectId: projectId,
    };
    await showMemberActions({ ...data });
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
        {members.map((user) => (
          <li key={user.id} className={styles.userWrapper} onClick={() => handleOnClick(user)}>
            <UserItem
              username={user.username}
              email={user.isOwner ? "Владелец проекта" : user.email}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
