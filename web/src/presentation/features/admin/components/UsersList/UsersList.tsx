import clsx from "clsx";

import type { AdminUser } from "@/domain/models/AdminUser";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { useDevice } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { adminTexts } from "@/shared/locales/admin";

import { useAdminUserMenuItems, useAdminUsers } from "../../hooks";
import { UserSummary } from "../UserSummary";

import styles from "./UsersList.module.css";

/** All users of the service by registration date (ADR-0014). */
export function UsersList() {
  const { data: users = [] } = useAdminUsers();

  return (
    <div className={styles.list}>
      {users.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
    </div>
  );
}

/**
 * A user with actions: on a phone, a bottom sheet on tapping the row; wider, a "…" menu
 * on hover, like project members.
 */
function UserRow({ user }: { user: AdminUser }) {
  const { menuItems } = useAdminUserMenuItems(user);
  const { showAdminUserActions } = useGlobalModals();
  const isPhone = useDevice() === "mobile";
  const hasActions = menuItems.length > 0;

  if (isPhone && hasActions) {
    return (
      <button
        type="button"
        className={clsx(styles.row, styles.tappable)}
        onClick={() => showAdminUserActions({ user })}
      >
        <UserSummary user={user} />
      </button>
    );
  }

  return (
    <div className={clsx(styles.row, hasActions && styles.withMenu)}>
      <UserSummary user={user} />
      {hasActions && (
        <div className={styles.menu}>
          <DropdownMenu
            trigger={
              <IconButton
                icon={ICONS.menuHorizontal}
                size="24px"
                aria-label={adminTexts.users.actions}
              />
            }
            items={menuItems}
          />
        </div>
      )}
    </div>
  );
}
