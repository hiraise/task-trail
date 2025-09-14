import styles from "./CommentsList.module.css";

import { mockComments } from "./Comments.mocks";
import CommentsListItem from "./CommentsListItem";

export default function CommentsList() {
  return (
    <div className={styles.comments}>
      {mockComments.map((comment) => (
        <CommentsListItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
