import styles from "./TaskItem.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface TaskItemProps {
  id?: string;
  title: string;
}

export function TaskItem({ title }: TaskItemProps) {
  return (
    <div className={styles.taskWrapper}>
      <Icon as={ICONS.task} size="20px" />
      <p className={styles.title}>{title}</p>
    </div>
  );
}
