import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { MockTask } from "./KanbanBoard.mocks";
import { KanbanTaskItem } from "./KanbanTaskItem";

interface SortableKanbanTaskProps {
  task: MockTask;
}

export function SortableKanbanTask({ task }: SortableKanbanTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task: task },
  });

  const extraStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <KanbanTaskItem
      task={task}
      dragging={isDragging}
      ref={setNodeRef}
      extraStyle={extraStyle}
      {...attributes}
      {...listeners}
    />
  );
}
