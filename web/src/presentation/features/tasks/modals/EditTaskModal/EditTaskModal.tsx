import type { TaskChanges } from "@/domain/repositories/TaskRepository";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { TaskProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals/BaseModal";
import { BaseModal } from "@/presentation/shared/modals/BaseModal";
import { TEXTS } from "@/shared/locales/texts";

import { EditTaskForm } from "../../components";
import { useEditTask } from "../../hooks";

export function EditTaskModal(props: BaseModalProps) {
  const { task } = useGlobalModalProps<TaskProps>() ?? {};
  const { mutateAsync: editTask } = useEditTask();

  if (!task) return null;

  const handleSubmit = async (changes: TaskChanges) => {
    // Nothing changed — no request needed (UpdateTaskRequest requires at least one field)
    if (Object.keys(changes).length > 0) {
      try {
        await editTask({ taskId: task.id, ...changes });
      } catch {
        // useEditTask has shown the error; the modal stays open
        return;
      }
    }
    props.onClose();
  };

  return (
    <BaseModal {...props} title={TEXTS.tasks.edit}>
      <EditTaskForm task={task} onSubmit={handleSubmit} />
    </BaseModal>
  );
}
