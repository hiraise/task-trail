import { mockComments } from "./Comments.mocks";
import styles from "./CommentsList.module.css";
import CommentsListItem from "./CommentsListItem";

export function CommentsList() {
  return (
    <div className={styles.comments}>
      {mockComments.map((comment) => (
        <CommentsListItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
