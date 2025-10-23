import { TEXTS } from "@/shared/locales/texts";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { EditTaskFormDesktop, FormValues } from "../widgets/tasks/EditTaskForm";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { EditTaskProps } from "@/shared/hooks/useGlobalModals";
import { Task } from "@/domain/task/task.entity";
import { useEditTask } from "@/application/tasks/hooks/useEditTask";

export default function EditTaskModal(props: BaseModalProps<string>) {
  const { title, description } = useGlobalModalProps<EditTaskProps>() ?? {};
  const task: Partial<Task> = { title, description };

  const { mutateAsync: editTask } = useEditTask();

  const submitHandler = async (data: FormValues) => {
    await editTask({ name: data.title, description: data.description });
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
