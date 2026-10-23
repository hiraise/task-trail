import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import type { Board } from "@/domain/models/Board";
import type { Task } from "@/domain/models/Task";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { boardsTexts } from "@/shared/locales/boards";

import { useProjectsMemberIds } from "../../../projects/hooks";
import { useOpenCreateTask, useTaskStatuses } from "../../../tasks/hooks";
import { useBoardTasks, useCollapsedLanes, useKanbanDragDrop } from "../../hooks";

import type { Cell } from "./kanban";
import { NO_ASSIGNEE, buildLanes, isInCell } from "./kanban";
import styles from "./KanbanBoard.module.css";
import { KanbanCard } from "./KanbanCard";
import { KanbanCell } from "./KanbanCell";
import { KanbanHeader } from "./KanbanHeader";
import { KanbanLane } from "./KanbanLane";

/** From this width a card opens the task in a modal over the board, narrower — the task page */
const TASK_MODAL_QUERY = "(min-width: 1024px)";

/**
 * The kanban of a board (ADR-0029, stage 2 plan, step 5): columns are statuses, swimlanes are
 * board members and the "no assignee" lane; one member — no swimlanes. The board scrolls both ways
 * inside itself: column headers stick to the top, lane names stay on the left.
 */
export function KanbanBoard({ board }: { board: Board }) {
  const { data: statuses } = useTaskStatuses();
  const { data: tasks } = useBoardTasks(board.id);
  // Archived projects have no tasks on the board and take no new ones
  const activeProjectIds = useMemo(
    () => board.projects.filter((project) => !project.archivedAt).map((project) => project.id),
    [board.projects],
  );
  const membersByProject = useProjectsMemberIds(activeProjectIds);
  const lanes = useMemo(() => buildLanes(board), [board]);
  const { collapsed, toggle } = useCollapsedLanes(board.id);
  const dnd = useKanbanDragDrop({ boardId: board.id, tasks: tasks ?? [], membersByProject });
  const openCreateTask = useOpenCreateTask();
  const { showTask } = useGlobalModals();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A long press picks a card up, a swipe scrolls the board
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] } }),
  );

  const openTask = useCallback(
    (task: Task) => {
      if (window.matchMedia(TASK_MODAL_QUERY).matches) void showTask(task.id);
      else void navigate({ to: "/tasks/$taskId", params: { taskId: task.id } });
    },
    [showTask, navigate],
  );

  const createTask = useCallback(
    ({ statusId, laneKey }: Cell) =>
      openCreateTask({
        allowedProjectIds: activeProjectIds,
        statusId,
        // The form drops an assignee who is not a member of the chosen project
        assigneeId: laneKey === NO_ASSIGNEE ? undefined : laneKey,
      }),
    [openCreateTask, activeProjectIds],
  );

  if (!statuses || !tasks) return <div className={styles.board} aria-busy="true" />;

  const columns = { "--columns": statuses.length } as React.CSSProperties;
  const renderCells = (laneKey?: string) => {
    const cells = statuses.map((status) => {
      const cell: Cell = { statusId: status.id, laneKey };

      return { cell, tasks: dnd.tasks.filter((task) => isInCell(task, cell)) };
    });
    // A lane without tasks has the text only in the first column, "+" in the others (980:37533)
    const laneEmpty = cells.every(({ tasks: cellTasks }) => cellTasks.length === 0);

    return cells.map(({ cell, tasks: cellTasks }, i) => (
      <KanbanCell
        key={cell.statusId}
        cell={cell}
        tasks={cellTasks}
        createWithText={cellTasks.length === 0 && (!laneEmpty || i === 0)}
        pending={dnd.pending}
        onOpen={openTask}
        onCreate={createTask}
      />
    ));
  };

  return (
    <div className={styles.board} aria-label={boardsTexts.tasks}>
      <DndContext sensors={sensors} {...dnd.handlers}>
        <div className={styles.content} style={columns}>
          <div className={`${styles.grid} ${styles.headers}`}>
            {statuses.map((status) => (
              <KanbanHeader
                key={status.id}
                name={status.name}
                taskCount={dnd.tasks.filter((task) => task.statusId === status.id).length}
              />
            ))}
          </div>
          {lanes ? (
            lanes.map((lane) => (
              <KanbanLane
                key={lane.key}
                lane={lane}
                collapsed={collapsed.has(lane.key)}
                onToggle={() => toggle(lane.key)}
              >
                {renderCells(lane.key)}
              </KanbanLane>
            ))
          ) : (
            <div className={styles.grid}>{renderCells()}</div>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {dnd.activeTask && <KanbanCard task={dnd.activeTask} lifted />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
