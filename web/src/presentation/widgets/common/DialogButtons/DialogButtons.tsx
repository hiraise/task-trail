import styles from "./DialogButtons.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { SubmitButton } from "../../auth/_components";

interface DialogButtonsProps {
  onClose?: () => void;
  onApply?: () => void;
}

export function DialogButtons({ onClose, onApply }: DialogButtonsProps) {
  return (
    <div className={styles.buttons}>
      <SubmitButton $variant="secondary" onClick={onClose}>
        {TEXTS.cancel}
      </SubmitButton>
      <SubmitButton $variant="primary" onClick={onApply}>
        {TEXTS.apply}
      </SubmitButton>
    </div>
  );
}
