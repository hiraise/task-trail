import { useCallback, useMemo, useState } from "react";
import { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import {
  MockTask,
  boardColumns,
} from "@/presentation/widgets/boards/KanbanBoard/KanbanBoard.mocks";

export interface KanbanContainer {
  userId: number;
  column: (typeof boardColumns)[number];
}

export function useKanbanDragDrop(initialTasks: MockTask[]) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<MockTask | null>(null);

  /**
   * Returns all tasks assigned to a specific user.
   * @param {number} userId - The user's ID.
   */
  const getTasksByUser = useCallback(
    (userId: number) => tasks.filter((task) => task.userId === userId),
    [tasks]
  );

  /**
   * Sets the active task when a drag operation starts.
   * @param {DragStartEvent} event - The drag start event.
   */
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveTask(active.data.current?.task ?? null);
  }, []);

  /**
   * Updates the status of a task when it is dragged over a different column.
   * @param {DragOverEvent} event - The drag over event.
   */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveTask = active.data.current?.type === "Task";
    if (!isActiveTask) return;

    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Container";
    const container: KanbanContainer = over.data.current?.container;

    // Drop Task on another Task
    if (isActiveTask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return tasks;

        const task = tasks[activeIndex];
        const overTask = tasks[overIndex];

        if (task.userId !== overTask.userId || task.status !== overTask.status) {
          const newTasks = [...tasks];
          newTasks[activeIndex] = { ...task, userId: overTask.userId, status: overTask.status };
          return arrayMove(newTasks, activeIndex, overIndex);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Drop Task on another column
    if (container && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return tasks;

        const task = tasks[activeIndex];
        const { userId, column } = container;

        if (task.userId !== userId || task.status !== column) {
          const updatedTasks = tasks.map((task) => {
            if (task.id === activeId) {
              return { ...task, userId: container.userId, status: container.column };
            }
            return task;
          });
          return arrayMove(updatedTasks, activeIndex, activeIndex);
        }
        return tasks;
      });
    }
  }, []);

  /**
   * Handles the logic when a drag operation ends, updating task position or column as needed.
   * @param {DragEndEvent} event - The drag end event.
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
  }, []);

  const handlers = useMemo(
    () => ({
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragOver, handleDragEnd]
  );

  return {
    tasks,
    activeTask,
    handlers,
    getTasksByUser,
  };
}
