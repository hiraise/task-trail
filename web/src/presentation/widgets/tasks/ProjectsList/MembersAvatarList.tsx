import { UserAvatar } from "../../common/UserAvatar";
import styles from "./MembersAvatarList.module.css";

interface MembersAvatarListProps {
  memberIds: number[];
  maxVisible?: number;
}

export function MembersAvatarList({ memberIds, maxVisible = 8 }: MembersAvatarListProps) {
  const visibleMembers = memberIds.slice(0, maxVisible);
  const remainingCount = memberIds.length - maxVisible;

  return (
    <div className={styles.membersList}>
      {visibleMembers.map((memberId) => (
        <UserAvatar key={memberId} variant="small" />
      ))}
      {remainingCount > 0 && (
        <div className={styles.remainingCount}>
          <span className="caption-reg">{`+${remainingCount}`}</span>
        </div>
      )}
    </div>
  );
}
