import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { KanbanTaskItem } from "./KanbanTaskItem";
import { MockTask } from "./KanbanBoard.mocks";

interface SortableKanbanTaskProps {
  task: MockTask;
}

export function SortableKanbanTask({ task }: SortableKanbanTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
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
