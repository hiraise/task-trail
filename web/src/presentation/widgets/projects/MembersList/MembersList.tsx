import { useParams } from "next/navigation";
import clsx from "clsx";

import styles from "./MembersList.module.css";

import { UserItem } from "./UserItem";
import { ProjectMember } from "@/domain/project/project.entity";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

interface MembersListProps {
  group: "admins" | "members";
  members: ProjectMember[];
}

export function MembersList({ group, members }: MembersListProps) {
  const projectId = Number(useParams().id);
  const { data: currentUser } = useGetCurrentUser();
  const { showMemberActions } = useGlobalModals();

  if (!currentUser) return null;

  const handleOnClick = async (user: ProjectMember) => {
    const data = {
      memberId: user.id,
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
