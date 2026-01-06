import { DndContext, DragOverlay } from "@dnd-kit/core";

import type { MockBoardDto } from "@/application/dto/MockBoardDto";
import { useKanbanDragDrop } from "@/presentation/features/boards/hooks";

import { boardColumns, mockBoardTasks } from "./KanbanBoard.mocks";
import styles from "./KanbanBoard.module.css";
import { KanbanGrid } from "./KanbanGrid";
import { KanbanHeader } from "./KanbanHeader";
import { KanbanTaskItem } from "./KanbanTaskItem";
import Swimline from "./Swimline";

export function KanbanBoard({ board }: { board: MockBoardDto }) {
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
