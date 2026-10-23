import clsx from "clsx";
import React from "react";

import { BOARD_NAME_MAX_LENGTH } from "@/domain/models/Board";
import { FormFieldError, Input } from "@/presentation/shared";
import { boardsTexts } from "@/shared/locales/boards";

import styles from "./BoardNameField.module.css";

interface BoardNameFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Current length of the value — for the 0/200 counter (frames 843:91482, 1772:147292) */
  length: number;
  error?: string;
}

/** Board name with a character counter; the limit is the contract's (BoardName). */
export const BoardNameField = React.forwardRef<HTMLInputElement, BoardNameFieldProps>(
  ({ length, error, ...props }, ref) => (
    <div className={styles.field}>
      <Input
        ref={ref}
        type="text"
        placeholder={boardsTexts.namePlaceholder}
        autoComplete="off"
        aria-invalid={!!error}
        {...props}
      />
      <div className={styles.footer}>
        {error ? <FormFieldError>{error}</FormFieldError> : <span />}
        <span
          className={clsx("caption-reg", styles.counter, length > BOARD_NAME_MAX_LENGTH && styles.over)}
        >
          {length}/{BOARD_NAME_MAX_LENGTH}
        </span>
      </div>
    </div>
  ),
);

BoardNameField.displayName = "BoardNameField";
