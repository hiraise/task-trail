import styles from "./Comments.module.css";

import CommentInput from "./CommentInput";
import { tasksTexts } from "@/shared/locales/tasks";
import CommentsList from "./CommentsList";

export function Comments() {
  return (
    <div className={styles.container}>
      <span className={styles.title}>{tasksTexts.comments.title}</span>
      <CommentInput />
      <CommentsList />
    </div>
  );
}
