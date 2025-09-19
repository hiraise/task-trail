import Link from "next/link";
import clsx from "clsx";

import styles from "./ProjectDesktopPage.module.css";

import { useGetProjectData } from "@/application/projects/hooks/useGetProjectData";
import { ROUTES } from "@/infrastructure/config/routes";
import { BackButton } from "@/presentation/ui/BackButton";
import { ProjectInfo } from "@/presentation/widgets/projects/ProjectInfo";
import { ProjectMenuButton } from "@/presentation/widgets/projects/ProjectMenuButton";
import { MembersAvatarList } from "@/presentation/widgets/tasks/ProjectsList/MembersAvatarList";
import { TEXTS } from "@/shared/locales/texts";
import { ProjectTask } from "@/presentation/widgets/projects/ProjectTask";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { FloatingButtonDesktop } from "@/presentation/widgets/projects/FloatingButton";

export function ProjectDesktopPage() {
  const { showSortOptions } = useGlobalModals();
  const { project, projectId, tasks, members } = useGetProjectData();
  const memberIds = members?.map((member) => member.id) || [];

  if (!project || !tasks) return null;

  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.contentWrapper}>
        <div className={clsx(styles.content, styles.taskInfo)}>
          <ProjectInfo project={project} />
        </div>
        <div className={clsx(styles.content, styles.members)}>
          <ProjectMenuButton
            href={ROUTES.projectMembers(projectId)}
            text={TEXTS.projects.members}
          />
          <MembersAvatarList memberIds={memberIds} variant="large" />
        </div>
        {/* Tasks */}
        <div className={clsx(styles.content, styles.taskList)}>
          <div className={styles.titleWrapper}>
            <h4>{TEXTS.projects.tasks}</h4>
            <IconButton icon={ICONS.sort} size="24px" onClick={showSortOptions} />
          </div>

          <div className={clsx(styles.content, styles.tasks)}>
            {tasks.map((task) => (
              <Link key={`${task.id}-${task.title}`} href={ROUTES.task(task.id)}>
                <ProjectTask title={task.title} />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <FloatingButtonDesktop />
    </div>
  );
}
