import { toast } from "sonner";

import styles from "./MembersList.module.css";

import { UserItem } from "./UserItem";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { ProjectMember } from "@/domain/project/project.entity";

interface MembersListProps {
  members: ProjectMember[];
}

export function MembersList({ members }: MembersListProps) {
  const handleOnClick = (id: number) => {
    toast.info(`User with ID ${id} clicked`);
  };

  return (
    <div className={styles.container}>
      {members.map((user) => {
        return (
          <div key={user.email} className={styles.userWrapper}>
            <UserItem username={user.username} email={user.email} />
            <IconButton
              icon={ICONS.delete}
              size="24px"
              onClick={() => handleOnClick(user.id)}
              color="rgba(0, 0, 0, 0.5)"
            />
          </div>
        );
      })}
    </div>
  );
}
