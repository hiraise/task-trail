import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import styles from "./Swimline.module.css";

import { MockTask } from "./KanbanBoard.mocks";
import { CreateTask } from "./CreateTask";
import { SortableKanbanTask } from "./SortableKanbanTask";

interface SwimlaneColumnProps {
  memberId: number;
  column: string;
  tasks: MockTask[];
  index: number;
}

export default function SwimlaneColumn({ memberId, column, tasks, index }: SwimlaneColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `column-${memberId}-${column}`,
    data: {
      type: "Container",
      container: {
        userId: memberId,
        column: column,
      },
    },
  });

  return (
    <div ref={setNodeRef} className={styles.swimlines}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableKanbanTask key={task.id} task={task} />
        ))}
      </SortableContext>
      {index === 0 ? <CreateTask variant="default" /> : <CreateTask variant="short" />}
    </div>
  );
}
