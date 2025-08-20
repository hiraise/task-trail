import styles from "./Comments.module.css";

import CommentInput from "./CommentInput";

export function Comments() {
  return (
    <div className={styles.container}>
      <span className={styles.title}>Комментарии</span>
      <CommentInput />
    </div>
  );
}
