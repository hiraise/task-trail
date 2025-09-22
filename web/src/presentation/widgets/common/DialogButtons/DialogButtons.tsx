import styles from "./DialogButtons.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { SubmitButton } from "../../auth/_components";

interface DialogButtonsProps {
  onClose?: () => void;
  onApply?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onLeave?: () => void;
  variant?: "apply" | "move" | "delete" | "leave";
}

export function DialogButtons({
  onClose,
  onApply,
  onMove,
  onDelete,
  onLeave,
  variant = "apply",
}: DialogButtonsProps) {
  return (
    <div className={styles.buttons}>
      <SubmitButton $variant="secondary" onClick={onClose}>
        {TEXTS.cancel}
      </SubmitButton>

      {variant === "apply" && (
        <SubmitButton $variant="primary" onClick={onApply}>
          {TEXTS.apply}
        </SubmitButton>
      )}
      {variant === "move" && (
        <SubmitButton $variant="primary" onClick={onMove}>
          {TEXTS.move}
        </SubmitButton>
      )}
      {variant === "delete" && (
        <SubmitButton $variant="primary" onClick={onDelete}>
          {TEXTS.delete}
        </SubmitButton>
      )}
      {variant === "leave" && (
        <SubmitButton $variant="primary" onClick={onLeave}>
          {TEXTS.leave}
        </SubmitButton>
      )}
    </div>
  );
}
