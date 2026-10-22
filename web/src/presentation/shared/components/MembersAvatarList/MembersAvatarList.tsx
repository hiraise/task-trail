import clsx from "clsx";

import { getUserDisplayName, type User } from "@/domain/models/User";

import { UserAvatar } from "../UserAvatar";

import styles from "./MembersAvatarList.module.css";

interface MembersAvatarListProps {
  users: User[];
  maxVisible?: number;
  variant?: "small" | "standard" | "large";
  bgColor?: string;
}

export function MembersAvatarList({
  users,
  maxVisible = 8,
  variant = "small",
  bgColor,
}: MembersAvatarListProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  const outlineStyle = { "--outline-color": bgColor } as React.CSSProperties;

  return (
    <div className={clsx(styles.membersList, styles[variant])} style={outlineStyle}>
      {visibleUsers.map((user) => (
        <UserAvatar
          key={user.id}
          variant={variant}
          src={user.avatarUrl}
          name={getUserDisplayName(user)}
        />
      ))}
      {remainingCount > 0 && (
        <div className={styles.remainingCount}>
          <span className="caption-reg">{`+${remainingCount}`}</span>
        </div>
      )}
    </div>
  );
}
