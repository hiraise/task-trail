import { useParams } from "next/navigation";

import type { ProjectId, UserId } from "@/domain/types";
import { MembersAvatarList } from "@/presentation/shared";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import {
  FloatingButtonDesktop,
  ProjectInfoMobile,
  ProjectMenuButton,
  ProjectTasks,
} from "../../components";
import { useProjectDetail } from "../../hooks";

import styles from "./ProjectMobilePage.module.css";

export function ProjectMobilePage() {
  const params = useParams();
  const projectId = params.id as ProjectId;
  const { data } = useProjectDetail(projectId);
  const { showProjectSettings } = useGlobalModals();

  if (!data) return null;

  const memberIds = data.members.map((member) => member.id) || [];

  //TODO: Optimize members and tasks

  return (
    <>
      <PagesMobileTemplate
        topBarBackTitle={TEXTS.projects.project}
        variant="menu"
        onActionClick={showProjectSettings}
      >
        <ProjectInfoMobile owner={data.owner.username ?? ""} project={data.project} />
        <ProjectMembers projectId={projectId} memberIds={memberIds} />
        <ProjectTasks projectId={projectId} tasks={data.tasks} className={styles.tasks} />
      </PagesMobileTemplate>
      <FloatingButtonDesktop />
    </>
  );
}

interface ProjectMembersProps {
  projectId: ProjectId;
  memberIds: UserId[];
}

function ProjectMembers({ projectId, memberIds }: ProjectMembersProps) {
  return (
    <div className={styles.members}>
      <ProjectMenuButton href={ROUTES.projectMembers(projectId)} text={TEXTS.projects.members} />
      <MembersAvatarList memberIds={memberIds} variant="large" />
    </div>
  );
}
