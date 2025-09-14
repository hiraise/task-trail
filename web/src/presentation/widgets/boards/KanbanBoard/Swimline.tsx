import React from "react";

import styles from "./Swimline.module.css";

import { User } from "@/domain/user/user.entity";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { boardColumns, MockTask } from "./KanbanBoard.mocks";
import SwimlaneColumn from "./SwimlaneColumn";

interface SwimlineProps {
  member: User;
  collapsed: boolean;
  onToggle: (id: number) => void;
  tasks: MockTask[];
}

export default function Swimline({ member, collapsed, onToggle, tasks }: SwimlineProps) {
  return (
    <div>
      <div className={styles.assigneeButton} onClick={() => onToggle(member.id)}>
        <span>{getDisplayName(member)}</span>
        <Icon as={collapsed ? ICONS.rightArrow : ICONS.downArrow} size="14px" />
      </div>

      {!collapsed && (
        <div className={styles.taskGrid}>
          {boardColumns.map((col, i) => {
            const tasksForCell = tasks.filter((task) => task.status === col);
            return (
              <SwimlaneColumn
                key={`${member.id}-${col}`}
                memberId={member.id}
                column={col}
                tasks={tasksForCell}
                index={i}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
