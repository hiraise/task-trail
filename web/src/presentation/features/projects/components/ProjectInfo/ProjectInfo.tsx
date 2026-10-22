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
  /** Имя владельца */
  owner?: string;
  /** Меню «…» шире телефона; на телефоне меню — в верхней панели страницы */
  menuItems: MenuItem[];
}

/** Название, описание, владелец и дата создания. На телефоне длинное описание свёрнуто в 3 строки. */
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
        {owner && `${owner}  |  `}
        {formatDate(project.createdAt)}
      </p>
    </div>
  );
}
