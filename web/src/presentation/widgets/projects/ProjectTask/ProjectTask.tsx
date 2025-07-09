import styles from "./ProjectTask.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface ProjectTaskProps {
  title: string;
}

export function ProjectTask({ title }: ProjectTaskProps) {
  return (
    <div className={styles.container}>
      <Icon as={ICONS.task} size="20px" />
      <p className={styles.title}>{title}</p>
    </div>
  );
}
