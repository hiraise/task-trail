import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import type { Task } from "@/domain/models/Task";
import type { BoardId, ProjectId, TaskId, UserId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { useChangeTaskAssignee, useChangeTaskStatus } from "../../tasks/hooks";
import type { Cell } from "../components/KanbanBoard/kanban";
import { applyMoves, canDropInLane, isInCell, moveToCell } from "../components/KanbanBoard/kanban";

/** What a droppable cell carries in `data`; a draggable card carries `{ task }`. */
export interface KanbanCellData {
  cell: Cell;
}

interface KanbanDragDropOptions {
  boardId: BoardId;
  /** Board tasks from the server, newest first */
  tasks: Task[];
  /** Members of the board's projects: a lane of a non-member takes no drop */
  membersByProject: ReadonlyMap<ProjectId, ReadonlySet<UserId>>;
}

/**
 * Drag and drop on the kanban (stage 2 plan, step 5). The card moves at once: the dragged card
 * shows where it will land, a dropped one stays there while the requests run — the status first,
 * then the assignee (ADR-0002). On an error the card goes back; the task hooks show the toast.
 */
export function useKanbanDragDrop({ boardId, tasks, membersByProject }: KanbanDragDropOptions) {
  const queryClient = useQueryClient();
  const { mutateAsync: changeStatus } = useChangeTaskStatus();
  const { mutateAsync: changeAssignee } = useChangeTaskAssignee();
  const [activeId, setActiveId] = useState<TaskId>();
  const [overCell, setOverCell] = useState<Cell>();
  /** Dropped tasks whose requests are still running */
  const [pending, setPending] = useState<ReadonlyMap<TaskId, Task>>(new Map());

  const activeTask = useMemo(() => {
    const task = tasks.find((item) => item.id === activeId);

    return task && (pending.get(task.id) ?? task);
  }, [tasks, activeId, pending]);

  const shownTasks = useMemo(() => {
    const moves = new Map(pending);

    if (activeTask && overCell && !isInCell(activeTask, overCell)) {
      moves.set(activeTask.id, moveToCell(activeTask, overCell));
    }

    return applyMoves(tasks, moves);
  }, [tasks, pending, activeTask, overCell]);

  // The server's answer goes into the board list at once: the card does not jump back while
  // the list is refetched
  const storeInBoard = useCallback(
    (task: Task) =>
      queryClient.setQueryData<Task[]>(QUERY_KEYS.board.tasks(boardId), (list) =>
        list && [task, ...list.filter((item) => item.id !== task.id)],
      ),
    [queryClient, boardId],
  );

  const commit = useCallback(
    async (task: Task, cell: Cell) => {
      const moved = moveToCell(task, cell);

      setPending((prev) => new Map(prev).set(task.id, moved));
      try {
        if (moved.statusId !== task.statusId) {
          storeInBoard(await changeStatus({ taskId: task.id, statusId: moved.statusId }));
        }
        if (moved.assigneeId !== task.assigneeId) {
          storeInBoard(await changeAssignee({ taskId: task.id, assigneeId: moved.assigneeId ?? null }));
        }
      } catch {
        // The task hooks have shown the error; the card returns to where the server has it
      } finally {
        setPending((prev) => {
          const next = new Map(prev);

          next.delete(task.id);

          return next;
        });
      }
    },
    [changeStatus, changeAssignee, storeInBoard],
  );

  const reset = useCallback(() => {
    setActiveId(undefined);
    setOverCell(undefined);
  }, []);

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    navigator.vibrate?.(50);
    setActiveId(String(active.id));
  }, []);

  // The dragged card is drawn in the cell it hovers, so its draggable data is already moved:
  // the task is taken as the server has it
  const onDragOver = useCallback(
    ({ over }: DragOverEvent) => {
      const cell = (over?.data.current as KanbanCellData | undefined)?.cell;

      // A lane of a person outside the task's project shows no drop place: the card stays
      setOverCell(
        activeTask && cell && canDropInLane(activeTask, cell.laneKey, membersByProject) ? cell : undefined,
      );
    },
    [activeTask, membersByProject],
  );

  const onDragEnd = useCallback(
    ({ active }: DragEndEvent) => {
      const task = tasks.find((item) => item.id === active.id);
      const target = overCell;

      reset();
      // A card whose requests still run is not moved again until they finish
      if (task && target && !pending.has(task.id) && !isInCell(task, target)) {
        void commit(task, target);
      }
    },
    [tasks, overCell, pending, commit, reset],
  );

  const handlers = useMemo(
    () => ({ onDragStart, onDragOver, onDragEnd, onDragCancel: reset }),
    [onDragStart, onDragOver, onDragEnd, reset],
  );

  const pendingIds = useMemo(() => new Set(pending.keys()), [pending]);

  return { tasks: shownTasks, activeTask, pending: pendingIds, handlers };
}
