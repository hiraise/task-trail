import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { useTaskMenuItems } from "@/presentation/features/tasks/hooks/useTaskMenuItems";

import { useGlobalModalProps } from "../../hooks";
import { BaseModal, type BaseModalProps } from "../BaseModal";

import { TaskSettings } from "./TaskSettings";

export default function TaskSettingsModal(props: BaseModalProps<void>) {
  const { task } = useGlobalModalProps<{ task: TaskResponseDto }>() ?? {};
  const { menuItems } = useTaskMenuItems(task ?? ({} as TaskResponseDto));

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
