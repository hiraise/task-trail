import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { EditProjectProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import type { FormValues } from "../../components";
import { EditProjectForm } from "../../components";
import { useEditProject } from "../../hooks";

export function EditProjectModal(props: BaseModalProps<void>) {
  const { projectId, name = "", description = "" } = useGlobalModalProps<EditProjectProps>() ?? {};
  const { mutateAsync: editProject } = useEditProject();

  if (!projectId) return null;

  // Send only the changed fields; an empty description removes it (null)
  const submitHandler = async (data: FormValues) => {
    const changes = {
      name: data.name !== name ? data.name : undefined,
      description: data.description !== description ? data.description || null : undefined,
    };

    try {
      if (changes.name !== undefined || changes.description !== undefined) {
        await editProject({ projectId, ...changes });
      }
      props.onClose();
    } catch {
      // useEditProject has shown the error; the form stays open
    }
  };

  return (
    <BaseModal {...props} title={TEXTS.projects.edit}>
      <EditProjectForm defaultValues={{ name, description }} submitHandler={submitHandler} />
    </BaseModal>
  );
}
