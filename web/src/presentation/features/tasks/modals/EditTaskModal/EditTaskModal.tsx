import type { Task } from "@/domain/models/Task";
import { DeviceBased } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { EditTaskProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals/BaseModal";
import { BaseModal } from "@/presentation/shared/modals/BaseModal";
import { TEXTS } from "@/shared/locales/texts";

import { EditTaskFormDesktop, type FormValues } from "../../components";
import { useEditTask } from "../../hooks";

export default function EditTaskModal(props: BaseModalProps<string>) {
  const { taskId, title, description } = useGlobalModalProps<EditTaskProps>() ?? {};
  const task: Partial<Task> = { name: title, description };

  const { mutateAsync: editTask } = useEditTask();

  if (!taskId) return;

  const submitHandler = async (data: FormValues) => {
    if (data.title !== task.name || data.description !== task.description) {
      await editTask({ taskId: taskId, title: data.title, description: data.description });
    }
    props.onClose();
  };

  return (
    <BaseModal {...props} title={TEXTS.tasks.edit}>
      <DeviceBased
        desktop={<EditTaskFormDesktop task={task} submitHandler={submitHandler} />}
        mobile={<EditTaskFormDesktop task={task} submitHandler={submitHandler} />}
      />
    </BaseModal>
  );
}
