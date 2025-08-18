import { Project } from "@/domain/project/project.entity";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { mockProjects } from "../tasks/ProjectsList/ProjectsList.mock";
import { ProjectsList } from "../tasks/ProjectsList";

export default function SelectProjectModal(props: BaseModalProps<Project>) {
  const handleOnSelect = (project: Project) => {
    props.onClose(project);
    console.log("Project selected:", project.name);
  };

  return (
    <BaseModal {...props} fullScreen={true} title="Проект">
      <ProjectsList projects={mockProjects} onSelect={handleOnSelect} />
    </BaseModal>
  );
}
