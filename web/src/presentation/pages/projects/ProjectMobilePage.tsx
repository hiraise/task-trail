import Link from "next/link";

import styles from "./ProjectMobilePage.module.css";

import { useGetProjectData } from "@/application/projects/hooks/useGetProjectData";
import { ICONS } from "@/infrastructure/config/icons";
import { ROUTES } from "@/infrastructure/config/routes";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { ProjectMenuButton } from "@/presentation/widgets/projects/ProjectMenuButton";
import { ProjectTask } from "@/presentation/widgets/projects/ProjectTask";
import { MembersAvatarList } from "@/presentation/widgets/tasks/ProjectsList/MembersAvatarList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

export function ProjectMobilePage() {
  const { project, owner, projectId, tasks, members } = useGetProjectData();
  const { showCreateTask, showProjectSettings } = useGlobalModals();

  const memberIds = members?.map((member) => member.id) || [];

  if (!project || !tasks) return null;

  const displayTasks = tasks.slice(0, 4) ?? [];

  return (
    <MainContainer>
      <DashboardHeader />
      <div className={styles.container}>
        <BackButton />
      </div>
      <div className={styles.content}>
        <div className={styles.titleWrapper}>
          <div className={styles.projectTitle}>
            <h1>{project.name}</h1>
            <IconButton icon={ICONS.menu} size="24px" onClick={showProjectSettings} />
          </div>
          <p className="body-reg-2">{project.description}</p>
          <p className="body-reg-2">
            {owner} | {project.createdAt}
          </p>
        </div>
        <div className={styles.members}>
          <ProjectMenuButton
            href={ROUTES.projectMembers(projectId)}
            text={TEXTS.projects.members}
          />
          <MembersAvatarList memberIds={memberIds} />
        </div>
        <div className="tasks">
          <ProjectMenuButton href={ROUTES.projectTasks(projectId)} text={TEXTS.projects.tasks} />
          <div className={styles.taskList}>
            {displayTasks.map((task) => (
              <Link key={task.id} href={ROUTES.task(task.id)}>
                <ProjectTask key={task.id} title={task.title} />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <FloatingButton onClick={showCreateTask} />
    </MainContainer>
  );
}
