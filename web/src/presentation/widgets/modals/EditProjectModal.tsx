import { TEXTS } from "@/shared/locales/texts";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { EditProjectProps } from "@/shared/hooks/useGlobalModals";
import { EditProjectFormDesktop, FormValues } from "../projects/EditProjectForm";
import { Project } from "@/domain/project/project.entity";
import { useEditProject } from "@/application/projects/hooks/useProject";

export default function EditProjectModal(props: BaseModalProps<void>) {
  const { name, description } = useGlobalModalProps<EditProjectProps>() ?? {};
  const project: Partial<Project> = { name, description };

  const { mutateAsync: editProject } = useEditProject();

  const submitHandler = async (data: FormValues) => {
    if (data.name !== project.name || data.description !== project.description) {
      await editProject({ name: data.name, description: data.description });
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
