import { useState, useMemo, useCallback } from "react";
import { motion as m, AnimatePresence } from "framer-motion";

import styles from "./Swimline.module.css";

import { User } from "@/domain/user/user.entity";
import { boardColumns, MockTask } from "./KanbanBoard.mocks";
import SwimlaneColumn from "./SwimlaneColumn";
import { KanbanGrid } from "./KanbanGrid";
import { AssigneeButton } from "./AssigneeButton";

/**
 * Swimlane component represents a row in the Kanban board for a specific team member.
 * Each swimlane contains columns (task statuses) with the member's tasks.
 * The swimlane can be collapsed/expanded using the AssigneeButton.
 */
interface SwimlineProps {
  member: User;
  tasks: MockTask[];
}

export default function Swimline({ member, tasks }: SwimlineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);

  const tasksByColumn = useMemo(() => {
    return boardColumns.reduce((acc, col) => {
      acc[col] = tasks.filter((task) => task.status === col);
      return acc;
    }, {} as Record<string, MockTask[]>);
  }, [tasks]);

  return (
    <div className={styles.swimline}>
      <AssigneeButton user={member} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <AnimatePresence>
        {!isCollapsed && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            role="region"
            aria-label={`Tasks for ${member.username}`}
          >
            <KanbanGrid>
              {boardColumns.map((col) => (
                <SwimlaneColumn
                  key={`${member.id}-${col}`}
                  memberId={member.id}
                  column={col}
                  tasks={tasksByColumn[col]}
                />
              ))}
            </KanbanGrid>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
