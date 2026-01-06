import clsx from "clsx";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import { useProjectDetail } from "../../hooks";
import { useProjectMenuItems } from "../../hooks/useProjectMenuItems";

import styles from "./ProjectInfoDesktop.module.css";

export function ProjectInfoDesktop({ project }: { project: ProjectResponseDto }) {
  const { data } = useProjectDetail(Number(project.id));
  const { menuItems } = useProjectMenuItems(project.id);

  if (!data) return null;

  return (
    <div className={styles.container}>
      <div className={styles.titleWapper}>
        <div className={styles.title}>
          <h2>{project.name}</h2>
          <span className="body-reg-2">{project.description}</span>
          <span className={clsx("body-reg-2", styles.owner)}>
            {data.owner.username} | {project.createdAt}
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
