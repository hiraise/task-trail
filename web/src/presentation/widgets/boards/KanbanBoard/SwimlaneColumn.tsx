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
}

export default function SwimlaneColumn({ memberId, column, tasks }: SwimlaneColumnProps) {
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
    <div ref={setNodeRef} className={styles.swimlineBg}>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableKanbanTask key={task.id} task={task} />
        ))}
      </SortableContext>
      {tasks.length > 0 ? <CreateTask variant="short" /> : <CreateTask variant="default" />}
    </div>
  );
}
