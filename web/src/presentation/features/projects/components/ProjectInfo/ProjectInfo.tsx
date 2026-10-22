import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import type { Project } from "@/domain/models/Project";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";
import { formatDate } from "@/shared/utils/formatters";

import styles from "./ProjectInfo.module.css";

interface ProjectInfoProps {
  project: Project;
  /** Owner's name */
  owner?: string;
  /** The "…" menu wider than a phone; on a phone the menu is in the page top bar */
  menuItems: MenuItem[];
}

/**
 * Name, description, then owner, creation date and project key in one line. On a phone a long
 * description is collapsed to 3 lines.
 */
export function ProjectInfo({ project, owner, menuItems }: ProjectInfoProps) {
  const [isClamped, setIsClamped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;

    if (!el) return;

    const observer = new ResizeObserver(() => setIsClamped(el.scrollHeight > el.clientHeight + 1));

    observer.observe(el);

    return () => observer.disconnect();
  }, [isExpanded]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.name}>{project.name}</h2>
        <div className={styles.menu}>
          <DropdownMenu
            trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
            items={menuItems}
          />
        </div>
      </div>
      {project.description && (
        <div className={styles.description}>
          <p ref={textRef} className={clsx("body-reg-2", !isExpanded && styles.clamped)}>
            {project.description}
          </p>
          {(isClamped || isExpanded) && (
            <button
              type="button"
              className={clsx("btn-font-s", styles.more)}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? TEXTS.hide : TEXTS.showMore}
            </button>
          )}
        </div>
      )}
      <p className={clsx("body-reg-2", styles.owner)}>
        {[owner, formatDate(project.createdAt), project.key].filter(Boolean).join("  |  ")}
      </p>
    </div>
  );
}
