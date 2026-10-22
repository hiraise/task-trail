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
 * Form buttons: in a card, "Cancel" and "Save" while the form is focused or changed;
 * on a separate page, one button at the bottom.
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
