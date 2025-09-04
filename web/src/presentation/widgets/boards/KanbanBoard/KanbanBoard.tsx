import { useState } from "react";

import styles from "./KanbanBoard.module.css";

import { Board } from "@/domain/board/board.entity";
import Swimline from "./Swimline";
import { boardColumns, mockBoardTasks } from "./KanbanBoard.mocks";
import { useKanbanDragDrop } from "@/application/boards/useKanbanDragDrop";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { KanbanTaskItem } from "./KanbanTaskItem";

export function KanbanBoard({ board }: { board: Board }) {
  const [collapsedUsers, setCollapsedUsers] = useState<Record<number, boolean>>({});
  const { activeTask, handlers, getTasksByUser } = useKanbanDragDrop(mockBoardTasks);

  const toggleCollapse = (userId: number) => {
    setCollapsedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };
  return (
    <div className={styles.kanbanContainer}>
      <DndContext
        onDragStart={handlers.handleDragStart}
        onDragOver={handlers.handleDragOver}
        onDragEnd={handlers.handleDragEnd}
      >
        <div className={styles.kanbanGrid}>
          {/* Headers */}
          {boardColumns.map((col) => (
            <div key={col} className={styles.kanbanColumnHeader}>
              {col}
            </div>
          ))}
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
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && <KanbanTaskItem task={activeTask} dragging={true} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
