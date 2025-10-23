import styles from "./KanbanBoard.module.css";

import { Board } from "@/domain/board/board.entity";
import Swimline from "./Swimline";
import { boardColumns, mockBoardTasks } from "./KanbanBoard.mocks";
import { useKanbanDragDrop } from "@/application/boards/useKanbanDragDrop";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { KanbanTaskItem } from "./KanbanTaskItem";
import { KanbanGrid } from "./KanbanGrid";
import { KanbanHeader } from "./KanbanHeader";

export function KanbanBoard({ board }: { board: Board }) {
  const { activeTask, handlers, getTasksByUser, countTaskByStatus } =
    useKanbanDragDrop(mockBoardTasks);

  return (
    <div className={styles.kanbanContainer}>
      <DndContext {...handlers}>
        {/* Headers */}
        <KanbanGrid>
          {boardColumns.map((col) => (
            <KanbanHeader key={col} name={col} taskCount={countTaskByStatus(col)} />
          ))}
        </KanbanGrid>
        {/* Swimlines */}
        <div className={styles.swimlineContainer}>
          {board.members.map((member) => (
            <Swimline key={member.id} member={member} tasks={getTasksByUser(member.id)} />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && <KanbanTaskItem task={activeTask} dragging={true} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
