import styles from "./TaskInfo.module.css";

import { Task } from "@/domain/task/task.entity";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { DropdownMenu } from "@/presentation/widgets/common/DropdownMenu";
import { useTaskMenuItems } from "@/application/tasks/hooks/useTaskMenuItems";

export function TaskTitle({ task }: { task: Task }) {
  const { menuItems } = useTaskMenuItems(task);

  return (
    <div className={styles.titleWrapper}>
      <div className={styles.title}>
        <h1 className="multiline">{task.title}</h1>
        <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
      </div>
      <p className={styles.description}>{task.description}</p>
    </div>
  );
}
