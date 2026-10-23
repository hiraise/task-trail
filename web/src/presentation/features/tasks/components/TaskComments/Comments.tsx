import { tasksTexts } from "@/shared/locales/tasks";

import { CommentInput } from "./CommentInput";
import styles from "./Comments.module.css";
import { CommentsList } from "./CommentsList";

/** Comments; an archived task has no input and no comment menus (ADR-0027). */
export function Comments({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <div className={styles.container}>
      <h4>{tasksTexts.comments.title}</h4>
      {!readOnly && <CommentInput />}
      <CommentsList readOnly={readOnly} />
    </div>
  );
}
