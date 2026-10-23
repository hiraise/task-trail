import clsx from "clsx";

import type { Board } from "@/domain/models/Board";
import { Icon, IconButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";
import { TEXTS } from "@/shared/locales/texts";

import { useSetBoardProjects } from "../../hooks";

import styles from "./BoardProjects.module.css";

interface BoardProjectsProps {
  board: Board;
  isOwner: boolean;
}

/**
 * "Projects on the board" — chips with horizontal scroll (frame 1772:145700). The owner's arrow opens
 * the project picker (frames 1775:149125, 1340:66557, 1522:183763). Projects the viewer is not
 * a member of never appear: the server does not return them (ADR-0029).
 */
export function BoardProjects({ board, isOwner }: BoardProjectsProps) {
  const { showSelectBoardProjects } = useGlobalModals();
  const { mutate: setProjects } = useSetBoardProjects();

  const handleEdit = async () => {
    const selected = await showSelectBoardProjects({
      selectedIds: board.projects.map((project) => project.id),
      extraProjects: board.projects.filter((project) => project.archivedAt),
      applyText: boardsTexts.saveChanges,
    });

    if (selected) setProjects({ boardId: board.id, projectIds: selected });
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h4>{boardsTexts.projects}</h4>
        {isOwner && (
          <IconButton
            icon={ICONS.rightArrow}
            size="24px"
            aria-label={boardsTexts.projects}
            onClick={handleEdit}
          />
        )}
      </div>
      <ul className={styles.chips}>
        {board.projects.map((project) => (
          <li key={project.id} className={clsx("body-reg-2", styles.chip)}>
            <Icon as={ICONS.project} size="18px" />
            <span>{project.name}</span>
            {project.archivedAt && <span className={styles.archived}>· {TEXTS.archiveTag}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
