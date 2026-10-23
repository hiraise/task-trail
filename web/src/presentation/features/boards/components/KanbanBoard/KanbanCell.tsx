import { useDroppable } from "@dnd-kit/core";

import type { Task } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";

import type { KanbanCellData } from "../../hooks/useKanbanDragDrop";

import { CreateTask } from "./CreateTask";
import type { Cell } from "./kanban";
import { DraggableCard } from "./KanbanCard";
import styles from "./KanbanBoard.module.css";

interface KanbanCellProps {
  cell: Cell;
  tasks: Task[];
  /** "Create task" with text; otherwise a "+" (comments 980:37533, 980:37537) */
  createWithText: boolean;
  /** Cards whose requests are running */
  pending: ReadonlySet<TaskId>;
  onOpen: (task: Task) => void;
  onCreate: (cell: Cell) => void;
}

/** A column of one swimlane: cards newest first and the "create task" button. */
export function KanbanCell({ cell, tasks, createWithText, pending, onOpen, onCreate }: KanbanCellProps) {
  const data: KanbanCellData = { cell };
  const { setNodeRef } = useDroppable({ id: `${cell.statusId}:${cell.laneKey ?? ""}`, data });

  return (
    <div ref={setNodeRef} className={styles.cell}>
      {tasks.map((task) => (
        <DraggableCard key={task.id} task={task} disabled={pending.has(task.id)} onOpen={onOpen} />
      ))}
      <CreateTask withText={createWithText} onClick={() => onCreate(cell)} />
    </div>
  );
}
