import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { MemberActionsProps } from "@/presentation/shared/hooks/useGlobalModals";

import { Icon } from "../../../../shared";
import { BaseModal } from "../../../../shared/modals/BaseModal/BaseModal";
import type { BaseModalProps } from "../../../../shared/modals/BaseModal/BaseModal.types";
import { useMembersMenuItems } from "../../hooks/useMembersMenuItems";

import styles from "./MemberActionsModal.module.css";

export function MemberActionsModal(props: BaseModalProps<void>) {
  const modalProps = useGlobalModalProps<MemberActionsProps>();

  const { memberId, memberDisplayName, currentUserId, projectId } = modalProps || {};
  const { menuItems } = useMembersMenuItems(
    memberId ?? "-1",
    memberDisplayName ?? "No name",
    currentUserId ?? "-1",
    projectId ?? "-1",
  );

  if (menuItems.length === 0) return null;

  return (
    <BaseModal {...props} title="">
      <div className={styles.menu}>
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={styles.menuItem}
            style={{ color: item.color ? item.color : undefined }}
            onClick={() => item.onClick()}
          >
            {item.icon && <Icon as={item.icon} size="24px" inheritColor />}
            <span className="btn-font-s" style={{ color: "inherit" }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </BaseModal>
  );
}
