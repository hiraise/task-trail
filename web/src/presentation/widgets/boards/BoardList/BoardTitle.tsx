import { Icon } from "@/presentation/ui/Icon";
import styles from "./BoardListItem.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

interface BoardTitleProps {
  title: string;
  taskCount: number;
}

export function BoardTitle({ title, taskCount }: BoardTitleProps) {
  return (
    <div className={styles.titleWrapper}>
      <Icon as={ICONS.board} size="24px" />
      <div className={styles.titleContainer}>
        <span className={styles.titleText}>{title}</span>
        <span className={styles.taskCount}>{pluralizeTasks(taskCount)}</span>
      </div>
    </div>
  );
}
