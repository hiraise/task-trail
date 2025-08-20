import styles from "./Comments.module.css";

import { UserAvatar } from "../../common/UserAvatar";
import { Textarea } from "@/presentation/ui/Input";

export default function CommentInput() {
  return (
    <div className={styles.inputContainer}>
      <UserAvatar />
      <Textarea
        rows={3}
        id="comment"
        placeholder="Комментарий"
        autoComplete="off"
        className={styles.textarea}
      />
    </div>
  );
}
