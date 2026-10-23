import { AnimatePresence, motion as m } from "framer-motion";
import { useState } from "react";

import { getUserDisplayName } from "@/domain/models/User";
import { SubmitButton, Textarea, UserAvatar } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";

import { useGetCurrentUser } from "@/presentation/shared/hooks";

import styles from "./TaskActivity.module.css";

interface CommentInputProps {
  /** The text being edited; empty — a new comment */
  initialValue?: string;
  submitText: string;
  /** Resolves when the server accepted the text; on an error the text stays in the field */
  onSubmit: (text: string) => Promise<unknown>;
  /** Editing: cancel leaves the edit mode; a new comment just clears the field */
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * The comment field (frames 1161:73155, 1161:74167, 1161:74388): the buttons appear after the first
 * character; while editing (1161:75166, 1892:103244) they are always shown.
 */
export function CommentInput({
  initialValue = "",
  submitText,
  onSubmit,
  onCancel,
  autoFocus,
}: CommentInputProps) {
  const [value, setValue] = useState(initialValue);
  const [sending, setSending] = useState(false);
  const { data: me } = useGetCurrentUser();
  const showButtons = value.length > 0 || !!onCancel;

  const handleCancel = () => {
    setValue(initialValue);
    onCancel?.();
  };

  const handleSubmit = async () => {
    const text = value.trim();

    if (!text || sending) return;
    setSending(true);
    try {
      await onSubmit(text);
      setValue("");
    } catch {
      // The hook has shown the error; the text stays for another try
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.inputWrapper}>
      <div className={styles.inputContainer}>
        <UserAvatar src={me?.avatarUrl} name={me ? getUserDisplayName(me) : undefined} />
        <Textarea
          value={value}
          rows={3}
          placeholder={tasksTexts.comments.placeholder}
          aria-label={tasksTexts.comments.placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={10000}
          disabled={sending}
          className={styles.textarea}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <AnimatePresence mode="wait">
        {showButtons && (
          <m.div
            key="buttons"
            className={styles.buttons}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "tween", duration: 0.15 }}
          >
            <SubmitButton variant="secondary" onClick={handleCancel} disabled={sending}>
              {tasksTexts.comments.cancel}
            </SubmitButton>
            <SubmitButton
              variant="primary"
              onClick={handleSubmit}
              disabled={sending || !value.trim()}
            >
              {sending ? tasksTexts.comments.sending : submitText}
            </SubmitButton>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
