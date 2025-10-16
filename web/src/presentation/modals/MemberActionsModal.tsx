import styles from "./MemberActionsModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { MemberActionsProps } from "@/shared/hooks/useGlobalModals";
import { useMembersMenuItems } from "@/application/projects/hooks/useMembersMenuItems";
import { Icon } from "@/presentation/ui/Icon";

export default function MemberActionsModal(props: BaseModalProps<void>) {
  const modalProps = useGlobalModalProps<MemberActionsProps>();

  const { memberId, memberDisplayName, currentUserId, projectId } = modalProps || {};
  const { menuItems } = useMembersMenuItems(
    memberId ?? -1,
    memberDisplayName ?? "No name",
    currentUserId ?? -1,
    projectId ?? -1
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
