import styles from "./ProjectItem.module.css";
import { Project } from "@/domain/project/project.entity";

export function ProjectItem({ project }: { project: Project }) {
  return (
    <div className={styles.container}>
      <span className={styles.tittle}>{project.name}</span>
      {project.description && <span className={styles.description}>{project.description}</span>}
    </div>
  );
}
