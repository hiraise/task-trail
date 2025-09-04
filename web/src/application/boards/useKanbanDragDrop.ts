import { useState } from "react";
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
   * @returns {MockTask[]} Array of tasks for the user.
   */
  const getTasksByUser = (userId: number) => tasks.filter((task) => task.userId === userId);

  const getTasksByUserAndColumn = (userId: number, column: (typeof boardColumns)[number]) =>
    tasks.filter((task) => task.userId === userId && task.status === column);

  /**
   * Sets the active task when a drag operation starts.
   * @param {DragStartEvent} event - The drag start event.
   */
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveTask(tasks.find((task) => task.id === active.id) || null);
  };

  const updateTask = (task: MockTask, container: KanbanContainer) => {
    return {
      ...task,
      status: container.column,
      userId: container.userId,
    };
  };

  /**
   * Updates the status of a task when it is dragged over a different column.
   * @param {DragOverEvent} event - The drag over event.
   */
  const handleDragOver = ({ over }: DragOverEvent) => {
    if (!over) return;

    const overContainer: KanbanContainer | undefined = over.data.current?.container;
    if (!activeTask || !overContainer) return;

    const currentTask = tasks.find((task) => task.id === activeTask.id);
    if (!currentTask) return;

    const isDifferentContainer =
      currentTask.status !== overContainer.column || currentTask.userId !== overContainer.userId;

    if (isDifferentContainer) {
      const newTask = updateTask(currentTask, overContainer);
      const updatedTasks = tasks.map((task) => (task.id === activeTask.id ? newTask : task));
      setTasks(updatedTasks);
    }
  };

  /**
   * Handles the logic when a drag operation ends, updating task position or column as needed.
   * @param {DragEndEvent} event - The drag end event.
   */
  const handleDragEnd = ({ over }: DragEndEvent) => {
    if (!activeTask) return;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const isOverTask = tasks.some((task) => task.id === over.id);
    const overContainer: KanbanContainer | undefined = over.data.current?.container;

    if (isOverTask) {
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;

      if (activeTask.userId === overTask.userId && activeTask.status === overTask.status) {
        handleSortingWithinColumn(overTask);
      } else {
        handleCrossColumnDragWithPosition(overTask);
      }
    } else if (overContainer) {
      handleCrossColumnDragToEnd(overContainer);
    }

    setActiveTask(null);
  };

  const handleSortingWithinColumn = (overTask: MockTask) => {
    if (!activeTask) return;
    const columnTasks = getTasksByUserAndColumn(activeTask.userId, activeTask.status);
    const activeIndex = columnTasks.findIndex((t) => t.id === activeTask.id);
    const overIndex = columnTasks.findIndex((t) => t.id === overTask.id);

    if (activeIndex !== overIndex) {
      const newColumnTasks = arrayMove(columnTasks, activeIndex, overIndex);

      setTasks((ts) => {
        const otherTasks = ts.filter(
          (t) => !(t.userId === activeTask.userId && t.status === activeTask.status)
        );
        return [...otherTasks, ...newColumnTasks];
      });
    }
  };

  const handleCrossColumnDragWithPosition = (overTask: MockTask) => {
    if (!activeTask) return;
    const targetColumnTasks = getTasksByUserAndColumn(overTask.userId, overTask.status);
    const insertIndex = targetColumnTasks.findIndex((t) => t.id === overTask.id);

    // Create the updated task
    const updatedTask = {
      ...activeTask,
      status: overTask.status,
      userId: overTask.userId,
    };

    setTasks((ts) => {
      // Remove the task from its old position
      const withoutActive = ts.filter((t) => t.id !== activeTask.id);

      // Find the tasks of the target column (excluding the active task)
      const targetTasks = withoutActive.filter(
        (t) => t.userId === overTask.userId && t.status === overTask.status
      );

      // Insert at the desired position
      const newTargetTasks = [
        ...targetTasks.slice(0, insertIndex),
        updatedTask,
        ...targetTasks.slice(insertIndex),
      ];

      // Gather all other tasks
      const otherTasks = withoutActive.filter(
        (t) => !(t.userId === overTask.userId && t.status === overTask.status)
      );

      return [...otherTasks, ...newTargetTasks];
    });
  };

  const handleCrossColumnDragToEnd = (overContainer: KanbanContainer) => {
    if (!activeTask) return;
    if (activeTask.status === overContainer.column && activeTask.userId === overContainer.userId) {
      return;
    }

    const updatedTask = {
      ...activeTask,
      status: overContainer.column,
      userId: overContainer.userId,
    };

    setTasks((ts) => {
      const withoutActive = ts.filter((t) => t.id !== activeTask.id);

      const targetColumnTasks = withoutActive.filter(
        (t) => t.userId === overContainer.userId && t.status === overContainer.column
      );

      const otherTasks = withoutActive.filter(
        (t) => !(t.userId === overContainer.userId && t.status === overContainer.column)
      );

      return [...otherTasks, ...targetColumnTasks, updatedTask];
    });
  };

  return {
    tasks,
    activeTask,
    handlers: {
      handleDragStart,
      handleDragOver,
      handleDragEnd,
    },
    getTasksByUser,
  };
}
