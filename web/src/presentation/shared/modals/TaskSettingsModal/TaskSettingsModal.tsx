import type { Task } from "@/domain/models/Task";
import { useTaskMenuItems } from "@/presentation/features/tasks/hooks/useTaskMenuItems";

import { useGlobalModalProps } from "../../hooks";
import { BaseModal, type BaseModalProps } from "../BaseModal";

import { TaskSettings } from "./TaskSettings";

export default function TaskSettingsModal(props: BaseModalProps<void>) {
  const { task } = useGlobalModalProps<{ task: Task }>() ?? {};
  const { menuItems } = useTaskMenuItems(task ?? ({} as Task));

  if (!task) return null;

  return (
    <BaseModal {...props} title="">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {menuItems.map((item, index) => (
          <TaskSettings key={index} item={item} />
        ))}
      </div>
    </BaseModal>
  );
}
