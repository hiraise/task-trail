import styles from "./MembersList.module.css";

import { users as mockUsers } from "./MembersList.mock";
import { BaseUserData } from "../AddParticipantForm/AddParticipantForm";
import { UserItem } from "./UserItem";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { toast } from "sonner";

export interface MembersData extends BaseUserData {
  id: number;
  username?: string;
  avatarUrl?: string;
}

interface MembersListProps {
  availableUsers?: MembersData[]; // Optional prop to override mock users
}

export function MembersList({ availableUsers }: MembersListProps) {
  // Use provided users or fall back to mock users
  const usersToDisplay = availableUsers || mockUsers;

  // if (filteredUsers.length === 0) {
  //   return VALIDATION_PATTERNS.email.test(searchQuery) ? (
  //     <div
  //       className={clsx(styles.container, styles.selectUser)}
  //       onClick={() => onUserSelect({ email: searchQuery })}
  //     >
  //       <UserItem email={searchQuery} />
  //     </div>
  //   ) : (
  //     <div className={clsx(styles.container, styles.emptyState)}>
  //       {searchQuery && projectsTexts.userNotFound}
  //     </div>
  //   );
  // }

  const handleOnClick = (id: number) => {
    toast.info(`User with ID ${id} clicked`);
  };

  return (
    <div className={styles.container}>
      {usersToDisplay.map((user) => {
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
