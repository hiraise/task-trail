import { autoUpdate, flip, offset, size, useFloating } from "@floating-ui/react";
import { AnimatePresence, motion as m } from "framer-motion";
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import { getUserDisplayName } from "@/domain/models/User";
import { SubmitButton, Textarea, UserAvatar } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";
import { decodeMentions, encodeMentions, type Mention } from "@/shared/utils/mentions";

import { useGetCurrentUser } from "@/presentation/shared/hooks";

import styles from "./TaskActivity.module.css";
import { useMentionSuggestions } from "./useMentionSuggestions";

interface CommentInputProps {
  /** The text being edited, with mention tokens as the API stores it; empty — a new comment */
  initialValue?: string;
  /** Members of the task's project: suggestions after `@` (ADR-0039) */
  members: ProjectMember[];
  submitText: string;
  /** Resolves when the server accepted the text; on an error the text stays in the field */
  onSubmit: (text: string) => Promise<unknown>;
  /** Editing: cancel leaves the edit mode; a new comment just clears the field */
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * The comment field (frames 1161:73155, 1161:74167, 1161:74388): the buttons appear after the first
 * character; while editing (1161:75166, 1892:103244) they are always shown. The field shows mentions
 * as `@Name` and sends them as tokens (ADR-0039); the suggestion list — artboard G of stage 3.
 */
export function CommentInput({
  initialValue = "",
  members,
  submitText,
  onSubmit,
  onCancel,
  autoFocus,
}: CommentInputProps) {
  const [initial] = useState(() => decodeMentions(initialValue));
  const [value, setValue] = useState(initial.text);
  const [mentions, setMentions] = useState<Mention[]>(initial.mentions);
  const [caret, setCaret] = useState(0);
  const [sending, setSending] = useState(false);
  const { data: me } = useGetCurrentUser();
  const showButtons = value.length > 0 || !!onCancel;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The caret to restore after a pick: React re-renders the value and the browser moves the caret to the end
  const pendingCaret = useRef<number | null>(null);
  const listId = useId();
  const suggestions = useMentionSuggestions(value, caret, members);

  const { refs, floatingStyles } = useFloating({
    open: suggestions.open,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          elements.floating.style.setProperty("--reference-width", `${rects.reference.width}px`);
        },
      }),
    ],
  });

  // Editing starts with the caret after the text, where people continue typing
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!autoFocus || !textarea) return;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    setCaret(textarea.value.length);
  }, [autoFocus]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (pendingCaret.current === null || !textarea) return;
    textarea.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value]);

  const handleCancel = () => {
    setValue(initial.text);
    setMentions(initial.mentions);
    onCancel?.();
  };

  const pick = (member: ProjectMember) => {
    const result = suggestions.pick(member);

    if (!result) return;
    pendingCaret.current = result.caret;
    setValue(result.text);
    setCaret(result.caret);
    setMentions((list) => [...list, result.mention]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!suggestions.open) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        suggestions.move(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Enter":
      case "Tab":
        event.preventDefault();
        pick(suggestions.items[suggestions.active]);
        break;
      case "Escape":
        // The kanban TaskModal closes on Escape caught on window
        event.preventDefault();
        event.stopPropagation();
        suggestions.dismiss();
        break;
    }
  };

  const syncCaret = (event: { currentTarget: HTMLTextAreaElement }) =>
    setCaret(event.currentTarget.selectionStart);

  const handleSubmit = async () => {
    const text = value.trim();

    if (!text || sending) return;
    setSending(true);
    try {
      await onSubmit(encodeMentions(text, mentions));
      setValue("");
      setMentions([]);
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
          ref={(node) => {
            textareaRef.current = node;
            refs.setReference(node);
          }}
          value={value}
          {...comboboxProps(suggestions.open, listId, suggestions.active)}
          rows={3}
          placeholder={tasksTexts.comments.placeholder}
          aria-label={tasksTexts.comments.placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={10000}
          disabled={sending}
          className={styles.textarea}
          onChange={(e) => {
            setValue(e.target.value);
            syncCaret(e);
          }}
          onSelect={syncCaret}
          onKeyDown={handleKeyDown}
        />
        {suggestions.open && (
          <MentionList
            id={listId}
            items={suggestions.items}
            active={suggestions.active}
            onPick={pick}
            floatingRef={refs.setFloating}
            style={floatingStyles}
          />
        )}
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

/** ARIA of the field that owns the suggestion list */
const comboboxProps = (open: boolean, listId: string, active: number) => ({
  role: "combobox",
  "aria-autocomplete": "list" as const,
  "aria-expanded": open,
  "aria-controls": open ? listId : undefined,
  "aria-activedescendant": open ? `${listId}-${active}` : undefined,
});

interface MentionListProps {
  id: string;
  items: ProjectMember[];
  active: number;
  onPick: (member: ProjectMember) => void;
  floatingRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
}

/** The member suggestions under the comment field (stage 3 artboard G). */
function MentionList({ id, items, active, onPick, floatingRef, style }: MentionListProps) {
  return (
    <ul
      ref={floatingRef}
      id={id}
      role="listbox"
      aria-label={tasksTexts.comments.members}
      className={styles.suggestions}
      style={style}
    >
      {items.map((member, index) => (
        <li
          key={member.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === active}
          className={styles.suggestion}
          // Keep the focus in the field
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(member)}
        >
          <UserAvatar src={member.avatarUrl} name={getUserDisplayName(member)} />
          <span className="body-reg-2">{getUserDisplayName(member)}</span>
        </li>
      ))}
    </ul>
  );
}
