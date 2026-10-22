import clsx from "clsx";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import { getUserDisplayName } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import { DropdownMenu, IconButton, UserAvatar } from "@/presentation/shared";
import { useDevice } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";

import { useMembersMenuItems } from "../../hooks";

import styles from "./MemberRow.module.css";

interface MemberRowProps {
  member: ProjectMember;
  projectId: ProjectId;
}

/**
 * Участник с действиями по роли текущего пользователя: на телефоне — нижняя панель по нажатию
 * на строку, шире — меню «…» при наведении.
 */
export function MemberRow({ member, projectId }: MemberRowProps) {
  const { menuItems } = useMembersMenuItems(member, projectId);
  const { showMemberActions } = useGlobalModals();
  const isPhone = useDevice() === "mobile";
  const hasActions = menuItems.length > 0;
  const name = getUserDisplayName(member);

  const content = (
    <div className={styles.user}>
      <UserAvatar variant="large" src={member.avatarUrl} name={name} />
      <div className={styles.text}>
        <span className="body-med">{name}</span>
        <span className={clsx("body-reg-2", styles.email)}>{member.email}</span>
      </div>
    </div>
  );

  if (isPhone && hasActions) {
    return (
      <button
        type="button"
        className={clsx(styles.row, styles.tappable)}
        onClick={() => showMemberActions({ member, projectId })}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={clsx(styles.row, hasActions && styles.withMenu)}>
      {content}
      {hasActions && !isPhone && (
        <div className={styles.menu}>
          <DropdownMenu
            trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
            items={menuItems}
          />
        </div>
      )}
    </div>
  );
}
