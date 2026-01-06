import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { EditTaskFormDesktop, type FormValues } from "@/presentation/features/tasks/components";
import { DeviceBased } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { EditTaskProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { BaseModal } from "../../../../shared/modals/BaseModal/BaseModal";
import type { BaseModalProps } from "../../../../shared/modals/BaseModal/BaseModal.types";
import { useEditTask } from "../../hooks";

export default function EditTaskModal(props: BaseModalProps<string>) {
  const { taskId, title, description } = useGlobalModalProps<EditTaskProps>() ?? {};
  const task: Partial<TaskResponseDto> = { title, description };

  const { mutateAsync: editTask } = useEditTask();

  if (!taskId) return;

  const submitHandler = async (data: FormValues) => {
    if (data.title !== task.title || data.description !== task.description) {
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
