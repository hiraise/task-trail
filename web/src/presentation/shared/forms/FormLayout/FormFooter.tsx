import { SubmitButton } from "@/presentation/shared";

import { InlineFormButtons } from "./InlineFormButtons";
import styles from "./ProfileFormLayout.module.css";
import type { ProfileFormLayout } from "./types";

interface ProfileFormFooterProps {
  layout: ProfileFormLayout;
  focused: boolean;
  dirty: boolean;
  submitting: boolean;
  submitText: string;
  onCancel: () => void;
}

/**
 * Кнопки формы профиля: в карточке — «Отменить» и «Сохранить», пока форма в фокусе или изменена;
 * на отдельной странице — одна кнопка внизу.
 */
export function ProfileFormFooter({
  layout,
  focused,
  dirty,
  submitting,
  submitText,
  onCancel,
}: ProfileFormFooterProps) {
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
