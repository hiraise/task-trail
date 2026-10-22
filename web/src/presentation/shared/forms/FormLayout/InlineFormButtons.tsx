import { AnimatePresence, motion as m } from "framer-motion";

import { SubmitButton } from "@/presentation/shared";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./FormLayout.module.css";

interface InlineFormButtonsProps {
  visible: boolean;
  submitDisabled: boolean;
  onCancel: () => void;
}

/** «Отменить» и «Сохранить» формы в карточке: видны, пока форма в фокусе или изменена. */
export function InlineFormButtons({ visible, submitDisabled, onCancel }: InlineFormButtonsProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <m.div
          key="buttons"
          className={styles.buttons}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ type: "tween", duration: 0.15 }}
        >
          <SubmitButton variant="secondary" type="button" onClick={onCancel} className="btn-font-s">
            {TEXTS.cancel}
          </SubmitButton>
          <SubmitButton
            variant="primary"
            type="submit"
            className="btn-font-s"
            disabled={submitDisabled}
          >
            {TEXTS.save}
          </SubmitButton>
        </m.div>
      )}
    </AnimatePresence>
  );
}
