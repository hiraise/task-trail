import { useParams } from "next/navigation";

import type { ProjectId } from "@/domain/types";
import { BaseModal, Icon, type BaseModalProps } from "@/presentation/shared";

import { useProjectMenuItems } from "../../hooks/useProjectMenuItems";

import styles from "./ProjectSettingsModal.module.css";

export function ProjectSettingsModal(props: BaseModalProps<void>) {
  const params = useParams();
  const projectId = params.id as ProjectId;
  const { menuItems } = useProjectMenuItems(projectId);

  return (
    <BaseModal {...props} title="">
      <div className={styles.wrapper}>
        {menuItems.map((item, index) => (
          <button
            className={styles.button}
            key={index}
            style={{ color: item.color ? item.color : undefined }}
            onClick={item.onClick}
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
