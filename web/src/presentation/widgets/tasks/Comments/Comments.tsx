import styles from "./Comments.module.css";

import CommentInput from "./CommentInput";
import { tasksTexts } from "@/shared/locales/tasks";
import CommentsList from "./CommentsList";

export function Comments() {
  return (
    <div className={styles.container}>
      <h4>{tasksTexts.comments.title}</h4>
      <CommentInput />
      <CommentsList />
    </div>
  );
}
