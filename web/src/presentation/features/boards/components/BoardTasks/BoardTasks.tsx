import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import type { Board } from "@/domain/models/Board";
import { ContentTopBarDesktop, ContentTopBarMobile } from "@/presentation/shared";
import { useListSort } from "@/presentation/shared/hooks";
import { boardsTexts } from "@/shared/locales/boards";
import { sortItems } from "@/shared/utils/sortItems";

import { ProjectTask } from "../../../projects/components";
import { useBoardTasks } from "../../hooks";

import styles from "./BoardTasks.module.css";

interface BoardTasksProps {
  board: Board;
  className?: string;
}

/**
 * "Tasks on the board" (frames 1021:81575, 1775:151903): key, name and assignee avatar, sorting.
 * The server picks the tasks (ADR-0029); the kanban replaces this list in step 5.
 */
export function BoardTasks({ board, className }: BoardTasksProps) {
  const { sort, openSort } = useListSort("board-tasks");
  const { data: tasks } = useBoardTasks(board.id);
  const sorted = useMemo(() => tasks && sortItems(tasks, sort), [tasks, sort]);

  return (
    <section className={clsx(styles.container, className)} aria-label={boardsTexts.tasks}>
      <h4>{boardsTexts.tasks}</h4>
      <div className={styles.phoneOnly}>
        <ContentTopBarMobile onClick={openSort} />
      </div>
      <div className={styles.wideOnly}>
        <ContentTopBarDesktop onClick={openSort} />
      </div>
      {sorted &&
        (sorted.length > 0 ? (
          <ul role="list" className={styles.list}>
            {sorted.map((task) => (
              <li key={task.id}>
                <Link to="/projects/$id/tasks/$taskId" params={{ id: task.projectId, taskId: task.id }}>
                  <ProjectTask
                    taskKey={task.key}
                    title={task.name}
                    // An assignee of a board task is a board member (ADR-0029)
                    assignee={board.members.find((member) => member.id === task.assigneeId)}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty} role="status">
            <p className="caption-reg">{boardsTexts.noTasks}</p>
          </div>
        ))}
    </section>
  );
}
