import styles from "./Swimline.module.css";

import { User } from "@/domain/user/user.entity";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { boardColumns, MockTask } from "./KanbanBoard.mocks";
import SwimlaneColumn from "./SwimlaneColumn";
import { KanbanGrid } from "./KanbanGrid";

interface SwimlineProps {
  member: User;
  collapsed: boolean;
  onToggle: (id: number) => void;
  tasks: MockTask[];
}

export default function Swimline({ member, collapsed, onToggle, tasks }: SwimlineProps) {
  return (
    <div className={styles.swimline}>
      <div className={styles.assigneeButton} onClick={() => onToggle(member.id)}>
        <span>{getDisplayName(member)}</span>
        <Icon as={collapsed ? ICONS.rightArrow : ICONS.downArrow} size="14px" />
      </div>

      {!collapsed && (
        <KanbanGrid>
          {boardColumns.map((col) => {
            const tasksForCell = tasks.filter((task) => task.status === col);
            return (
              <SwimlaneColumn
                key={`${member.id}-${col}`}
                memberId={member.id}
                column={col}
                tasks={tasksForCell}
              />
            );
          })}
        </KanbanGrid>
      )}
    </div>
  );
}
