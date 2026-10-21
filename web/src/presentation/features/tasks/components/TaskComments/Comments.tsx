import { tasksTexts } from "@/shared/locales/tasks";

import { CommentInput } from "./CommentInput";
import styles from "./Comments.module.css";
import { CommentsList } from "./CommentsList";

export function Comments() {
  return (
    <div className={styles.container}>
      <h4>{tasksTexts.comments.title}</h4>
      <CommentInput />
      <CommentsList />
    </div>
  );
}
