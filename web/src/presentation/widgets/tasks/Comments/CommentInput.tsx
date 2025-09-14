import { useState } from "react";
import { AnimatePresence, motion as m } from "framer-motion";

import styles from "./Comments.module.css";

import { UserAvatar } from "../../common/UserAvatar";
import { Textarea } from "@/presentation/ui/Input";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { tasksTexts } from "@/shared/locales/tasks";

export default function CommentInput() {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const showButton = focused || value.length > 0;

  const handleCancel = () => {
    setFocused(false);
    setValue("");
  };

  //TODO: Add send comment logic
  const handleSubmit = () => {
    if (value.length === 0) return;
    console.log("Comment: ", value.trim());
    setFocused(false);
    setValue("");
  };

  return (
    <div className={styles.inputWrapper}>
      <div className={styles.inputContainer}>
        <UserAvatar />
        <Textarea
          value={value}
          rows={3}
          id="comment"
          placeholder="Комментарий"
          autoComplete="off"
          className={styles.textarea}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      <AnimatePresence mode="wait">
        {showButton && (
          <m.div
            key="buttons"
            className={styles.buttons}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "tween", duration: 0.15 }}
          >
            <SubmitButton $variant="text" onClick={handleCancel}>
              {tasksTexts.comments.cancel}
            </SubmitButton>
            <SubmitButton $variant="primary" onClick={handleSubmit}>
              {tasksTexts.comments.send}
            </SubmitButton>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
