import styles from "./ProjectMobilePage.module.css";

import { useGetProjectData } from "@/application/projects/hooks/useGetProjectData";
import { ROUTES } from "@/infrastructure/config/routes";
import { FloatingButtonDesktop } from "@/presentation/widgets/projects/FloatingButton";
import { ProjectMenuButton } from "@/presentation/widgets/projects/ProjectMenuButton";
import { ProjectTasks } from "@/presentation/widgets/projects/ProjectTask";
import { MembersAvatarList } from "@/presentation/widgets/tasks/ProjectsList/MembersAvatarList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";
import { PagesMobileTemplate } from "@/presentation/templates";
import { ProjectInfoMobile } from "@/presentation/widgets/projects/ProjectInfo";

export function ProjectMobilePage() {
  const { project, owner, projectId, tasks, members } = useGetProjectData();
  const { showProjectSettings } = useGlobalModals();

  const memberIds = members?.map((member) => member.id) || [];

  if (!project || !tasks) return null;

  //TODO: Optimize members and tasks

  return (
    <>
      <PagesMobileTemplate
        topBarBackTitle={TEXTS.projects.project}
        variant="menu"
        onActionClick={showProjectSettings}
      >
        <ProjectInfoMobile owner={owner} project={project} />
        <ProjectMembers projectId={projectId} memberIds={memberIds} />
        <ProjectTasks projectId={projectId} tasks={tasks} className={styles.tasks} />
      </PagesMobileTemplate>
      <FloatingButtonDesktop />
    </>
  );
}

interface ProjectMembersProps {
  projectId: number;
  memberIds: number[];
}

function ProjectMembers({ projectId, memberIds }: ProjectMembersProps) {
  return (
    <div className={styles.members}>
      <ProjectMenuButton href={ROUTES.projectMembers(projectId)} text={TEXTS.projects.members} />
      <MembersAvatarList memberIds={memberIds} variant="large" />
    </div>
  );
}
