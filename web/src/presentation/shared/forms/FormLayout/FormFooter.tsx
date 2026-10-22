import { SubmitButton } from "@/presentation/shared";

import { InlineFormButtons } from "./InlineFormButtons";
import styles from "./FormLayout.module.css";
import type { FormLayout } from "./types";

interface FormFooterProps {
  layout: FormLayout;
  focused: boolean;
  dirty: boolean;
  submitting: boolean;
  submitText: string;
  onCancel: () => void;
}

/**
 * Кнопки формы: в карточке — «Отменить» и «Сохранить», пока форма в фокусе или изменена;
 * на отдельной странице — одна кнопка внизу.
 */
export function FormFooter({
  layout,
  focused,
  dirty,
  submitting,
  submitText,
  onCancel,
}: FormFooterProps) {
  if (layout === "inline") {
    return (
      <InlineFormButtons
        visible={focused || dirty}
        submitDisabled={!dirty || submitting}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className={styles.submit}>
      <SubmitButton type="submit" className="btn-font-m" disabled={submitting}>
        {submitText}
      </SubmitButton>
    </div>
  );
}
