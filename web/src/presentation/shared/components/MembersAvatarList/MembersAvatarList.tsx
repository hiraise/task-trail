import clsx from "clsx";

import type { UserId } from "@/domain/types";

import { UserAvatar } from "../UserAvatar";

import styles from "./MembersAvatarList.module.css";

interface MembersAvatarListProps {
  memberIds: UserId[];
  maxVisible?: number;
  variant?: "small" | "standard" | "large";
  bgColor?: string;
}

export function MembersAvatarList({
  memberIds,
  maxVisible = 8,
  variant = "small",
  bgColor,
}: MembersAvatarListProps) {
  const visibleMembers = memberIds.slice(0, maxVisible);
  const remainingCount = memberIds.length - maxVisible;

  const outlineStyle = { "--outline-color": bgColor } as React.CSSProperties;

  return (
    <div className={clsx(styles.membersList, styles[variant])} style={outlineStyle}>
      {visibleMembers.map((memberId) => (
        <UserAvatar key={memberId} variant={variant} />
      ))}
      {remainingCount > 0 && (
        <div className={styles.remainingCount}>
          <span className="caption-reg">{`+${remainingCount}`}</span>
        </div>
      )}
    </div>
  );
}
