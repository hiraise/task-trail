import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { EditProjectProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import type { FormValues } from "../../components";
import { EditProjectForm } from "../../components";
import { useEditProject } from "../../hooks";

export function EditProjectModal(props: BaseModalProps<void>) {
  const {
    projectId,
    name = "",
    description = "",
    key,
  } = useGlobalModalProps<EditProjectProps>() ?? {};
  const { mutateAsync: editProject } = useEditProject();

  if (!projectId) return null;

  // Send only the changed fields; an empty description removes it (null). An error keeps the form
  // open: EditProjectForm shows a taken key under its field, useEditProject — the rest
  const submitHandler = async (data: FormValues) => {
    const changes = {
      name: data.name !== name ? data.name : undefined,
      description: data.description !== description ? data.description || null : undefined,
      key: data.key !== undefined && data.key !== key ? data.key : undefined,
    };

    if (Object.values(changes).some((value) => value !== undefined)) {
      await editProject({ projectId, ...changes });
    }
    props.onClose();
  };

  return (
    <BaseModal {...props} title={TEXTS.projects.edit}>
      <EditProjectForm defaultValues={{ name, description, key }} submitHandler={submitHandler} />
    </BaseModal>
  );
}
