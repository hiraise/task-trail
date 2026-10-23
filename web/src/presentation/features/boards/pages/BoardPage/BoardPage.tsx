import { useParams } from "@tanstack/react-router";

import type { Board } from "@/domain/models/Board";
import type { BoardId } from "@/domain/types";
import { BackButton } from "@/presentation/shared";
import { TopBarBackMobile } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { boardsTexts } from "@/shared/locales/boards";

import { FloatingButton } from "../../../projects/components";
import { BoardHeader, BoardMembers, BoardProjects, BoardTasks, KanbanBoard } from "../../components";
import { useBoard, useBoardMenuItems, useIsBoardOwner } from "../../hooks";

import styles from "./BoardPage.module.css";

/**
 * The board page: the header and the kanban (stage 2 plan, step 5). Tasks are created from
 * the kanban cells, so there is no floating "Create task" here.
 */
export function BoardPage() {
  const { id } = useParams({ from: "/_main/boards/$id/" });

  return (
    <BoardScreen boardId={id} backTo="/boards">
      {(board, menuItems) => (
        <>
          <section className={styles.section}>
            <BoardHeader board={board} menuItems={menuItems} showInfoLink />
          </section>
          <section className={`${styles.section} ${styles.kanban}`}>
            <KanbanBoard board={board} />
          </section>
        </>
      )}
    </BoardScreen>
  );
}

/**
 * Board info (frames 843:91329, 1340:27745, 1522:178121, 1772:145700, 1775:150747): projects,
 * members and tasks, like the project page.
 */
export function BoardInfoPage() {
  const { id } = useParams({ from: "/_main/boards/$id/info" });

  return (
    <BoardScreen boardId={id} withCreateTask>
      {(board, menuItems, isOwner) => (
        <>
          <section className={styles.section}>
            <BoardHeader board={board} menuItems={menuItems} />
          </section>
          <section className={styles.section}>
            <BoardProjects board={board} isOwner={isOwner} />
          </section>
          <section className={styles.section}>
            <BoardMembers board={board} isOwner={isOwner} />
          </section>
          <section className={styles.section}>
            <BoardTasks board={board} className={styles.tasks} />
          </section>
        </>
      )}
    </BoardScreen>
  );
}

interface BoardScreenProps {
  boardId: BoardId;
  /** Where "back" leads on a phone; without it, one level up the URL */
  backTo?: string;
  /** The floating "Create task": the new task gets the default status */
  withCreateTask?: boolean;
  children: (board: Board, menuItems: ReturnType<typeof useBoardMenuItems>["menuItems"], isOwner: boolean) => React.ReactNode;
}

/**
 * The frame of board pages. On a phone — a top bar with the board menu in a bottom sheet; from 768 px —
 * cards with the "…" menu next to the name. CSS switches the layout (ADR-0008).
 */
function BoardScreen({ boardId, backTo, withCreateTask = false, children }: BoardScreenProps) {
  const { data: board, isError } = useBoard(boardId);
  const { menuItems } = useBoardMenuItems(board);
  const isOwner = useIsBoardOwner(board);
  const { showBoardSettings } = useGlobalModals();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <TopBarBackMobile
          title={boardsTexts.board}
          backTo={backTo}
          variant={menuItems.length > 0 ? "menu" : "none"}
          onActionClick={() => showBoardSettings(boardId)}
        />
      </div>
      <BackButton className={styles.back} />

      {board && (
        <div className={styles.sections}>{children(board, menuItems, isOwner)}</div>
      )}
      {!board && !isError && (
        // While loading — empty cards: the screen does not go blank or jump
        <div className={styles.sections} aria-busy="true">
          <section className={styles.section} />
          <section className={styles.section} />
        </div>
      )}
      {isError && (
        <div className={styles.sections}>
          <section className={styles.section} role="status">
            <p className="body-reg-2">{boardsTexts.notFound}</p>
          </section>
        </div>
      )}
      {withCreateTask && board && board.projects.length > 0 && (
        <FloatingButton allowedProjectIds={board.projects.filter((p) => !p.archivedAt).map((p) => p.id)} />
      )}
    </div>
  );
}
