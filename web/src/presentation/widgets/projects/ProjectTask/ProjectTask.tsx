import styles from "./ProjectTask.module.css";

import { UserAvatar } from "../../common/UserAvatar";

interface ProjectTaskProps {
  title: string;
}

export function ProjectTask({ title }: ProjectTaskProps) {
  return (
    <div className={styles.container}>
      <span className="body-reg">{title}</span>
      <UserAvatar variant="small" />
    </div>
  );
}
