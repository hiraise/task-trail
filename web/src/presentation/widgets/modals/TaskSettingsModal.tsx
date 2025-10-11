import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { useTaskMenuItems } from "@/application/tasks/hooks/useTaskMenuItems";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { Task } from "@/domain/task/task.entity";
import { TaskSettings } from "../common/TaskSettings";

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
