import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, DeviceBased } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { EditProjectProps } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import type { FormValues } from "../../components";
import { EditProjectFormDesktop } from "../../components";
import { useEditProject } from "../../hooks";

export function EditProjectModal(props: BaseModalProps<void>) {
  const { projectId, name, description } = useGlobalModalProps<EditProjectProps>() ?? {};
  const project: Partial<ProjectResponseDto> = { id: projectId, name, description };

  const { mutateAsync: editProject } = useEditProject();

  if (!projectId) return;

  const submitHandler = async (data: FormValues) => {
    if (data.name !== project.name || data.description !== project.description) {
      await editProject({ projectId: projectId, name: data.name, description: data.description });
    }
    props.onClose();
  };

  return (
    <BaseModal {...props} title={TEXTS.projects.edit}>
      <DeviceBased
        desktop={<EditProjectFormDesktop project={project} submitHandler={submitHandler} />}
        mobile={<EditProjectFormDesktop project={project} submitHandler={submitHandler} />}
      />
    </BaseModal>
  );
}
