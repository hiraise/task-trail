import { ActionsMenu, BaseModal, type BaseModalProps } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { AdminUserActionsProps } from "@/presentation/shared/hooks/useGlobalModals";

import { UserSummary } from "../../components/UserSummary";
import { useAdminUserMenuItems } from "../../hooks";

import styles from "./AdminUserActionsModal.module.css";

/** User actions on a phone: a bottom sheet on tapping a list row. */
export function AdminUserActionsModal(props: BaseModalProps<void>) {
  const { user } = useGlobalModalProps<AdminUserActionsProps>() ?? {};

  if (!user) return null;

  return <AdminUserActions {...props} user={user} />;
}

function AdminUserActions({ user, ...props }: BaseModalProps<void> & AdminUserActionsProps) {
  const { menuItems } = useAdminUserMenuItems(user);

  if (menuItems.length === 0) return null;

  return (
    <BaseModal {...props} title="">
      <div className={styles.header}>
        <UserSummary user={user} />
      </div>
      <ActionsMenu items={menuItems} onClose={() => props.onClose()} />
    </BaseModal>
  );
}
