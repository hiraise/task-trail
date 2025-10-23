import { useState } from "react";

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
  const [collapsedUsers, setCollapsedUsers] = useState<Record<number, boolean>>({});
  const { activeTask, handlers, getTasksByUser, countTaskByStatus } =
    useKanbanDragDrop(mockBoardTasks);

  const toggleCollapse = (userId: number) => {
    setCollapsedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };
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
            <Swimline
              key={member.id}
              member={member}
              collapsed={collapsedUsers[member.id]}
              onToggle={toggleCollapse}
              tasks={getTasksByUser(member.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && <KanbanTaskItem task={activeTask} dragging={true} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
