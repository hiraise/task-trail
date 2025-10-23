import styles from "./ProjectInfoDesktop.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { DropdownMenu } from "../../common/DropdownMenu";
import { Project } from "@/domain/project/project.entity";
import { useProjectMenuItems } from "@/application/projects/hooks/useProjectMenuItems";
import { useGetProjectData } from "@/application/projects/hooks/useGetProjectData";
import clsx from "clsx";

export function ProjectInfo({ project }: { project: Project }) {
  const { owner } = useGetProjectData();
  const { menuItems } = useProjectMenuItems(project.id);

  return (
    <div className={styles.container}>
      <div className={styles.titleWapper}>
        <div className={styles.title}>
          <h2>{project.name}</h2>
          <span className="body-reg-2">{project.description}</span>
          <span className={clsx("body-reg-2", styles.owner)}>
            {owner} | {project.createdAt}
          </span>
        </div>
        <DropdownMenu
          trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
          items={menuItems}
        />
      </div>
    </div>
  );
}
