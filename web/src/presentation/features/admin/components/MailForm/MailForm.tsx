import clsx from "clsx";

import { SubmitButton } from "@/presentation/shared";
import {
  formClassName,
  type FormLayout,
  formStyles,
  labelClassName,
} from "@/presentation/shared/forms/FormLayout";
import { adminTexts } from "@/shared/locales/admin";
import { TEXTS } from "@/shared/locales/texts";

import { MailActions } from "./MailActions";
import { MailField } from "./MailField";
import styles from "./MailForm.module.css";
import { useMailForm } from "./useMailForm";

const texts = adminTexts.mail;

const ENCRYPTIONS = [
  { value: "none", label: texts.encryptionNone },
  { value: "starttls", label: texts.encryptionStarttls },
  { value: "tls", label: texts.encryptionTls },
] as const;

/**
 * SMTP settings (ADR-0017). Saving checks the connection on the server for up to 10 seconds; the fields
 * are disabled meanwhile. Test email and disabling are visible while the form is unchanged: they
 * work with the saved settings. In the section card, "Cancel" and "Save" appear on
 * change, without mail "Connect"; on a phone, a button at the bottom of the page.
 */
export function MailForm({ layout }: { layout: FormLayout }) {
  const inline = layout === "inline";
  const { form, mail, submit, cancel } = useMailForm(inline);
  const {
    register,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  const connected = !!mail;
  const labelClass = labelClassName(layout);
  const common = { labelClass, disabled: isSubmitting };

  return (
    <form
      className={clsx(formClassName(layout), styles.form)}
      onSubmit={submit}
      aria-busy={isSubmitting}
    >
      <div className={formStyles.fields}>
        <MailField
          {...common}
          name="host"
          label={texts.host}
          input={register("host")}
          error={errors.host}
          placeholder={texts.hostPlaceholder}
        />
        <MailField
          {...common}
          name="port"
          label={texts.port}
          input={register("port")}
          error={errors.port}
          placeholder={texts.portPlaceholder}
        />
        <fieldset className={clsx(styles.encryption, formStyles.wide)} disabled={isSubmitting}>
          <legend className={clsx(labelClass, styles.legend)}>{texts.encryption}</legend>
          <div className={styles.radios}>
            {ENCRYPTIONS.map(({ value, label }) => (
              <label key={value} className={styles.radio}>
                <input type="radio" value={value} {...register("encryption")} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <MailField
          {...common}
          name="sender"
          label={texts.sender}
          input={register("sender")}
          error={errors.sender}
          placeholder={texts.senderPlaceholder}
          wide
        />
        <MailField
          {...common}
          name="username"
          label={texts.username}
          input={register("username")}
          error={errors.username}
          placeholder={texts.optional}
        />
        <MailField
          {...common}
          name="password"
          label={texts.password}
          input={register("password")}
          error={errors.password}
          placeholder={mail?.passwordSet ? texts.passwordSaved : texts.optional}
          hint={mail?.passwordSet ? texts.passwordKeepHint : undefined}
          password
        />
      </div>

      <MailFormFooter
        inline={inline}
        connected={connected}
        dirty={isDirty}
        submitting={isSubmitting}
        onCancel={cancel}
      />
    </form>
  );
}

interface MailFormFooterProps {
  inline: boolean;
  connected: boolean;
  dirty: boolean;
  submitting: boolean;
  onCancel: () => void;
}

/** Button text and hint: checking in progress, save the settings, or connect mail. */
function footerTexts(connected: boolean, submitting: boolean) {
  if (submitting) return { submitLabel: texts.checkingButton, hint: texts.checking };
  if (connected) return { submitLabel: TEXTS.save, hint: undefined };

  return { submitLabel: texts.connect, hint: texts.checkHint };
}

function MailFormFooter(props: MailFormFooterProps) {
  const { inline, connected, dirty, submitting } = props;
  const { submitLabel, hint } = footerTexts(connected, submitting);
  const actions = connected && !dirty && <MailActions disabled={submitting} />;
  const hintText = hint && <span className={clsx("body-reg-2", styles.hint)}>{hint}</span>;

  if (inline) {
    return (
      <div className={styles.footer}>
        {actions}
        {hintText}
        <InlineButtons {...props} submitLabel={submitLabel} />
      </div>
    );
  }

  return (
    <>
      {actions}
      {hintText}
      <div className={formStyles.submit}>
        <SubmitButton type="submit" className="btn-font-m" disabled={submitting}>
          {submitLabel}
        </SubmitButton>
      </div>
    </>
  );
}

/**
 * Without mail "Connect" is always visible; with mail, "Cancel" and "Save" only on change:
 * focus on the test email and disable buttons must not show them.
 */
function InlineButtons({
  connected,
  dirty,
  submitting,
  onCancel,
  submitLabel,
}: MailFormFooterProps & { submitLabel: string }) {
  if (connected && !dirty) return null;

  return (
    <div className={styles.buttons}>
      {connected && (
        <SubmitButton
          type="button"
          variant="secondary"
          className="btn-font-s"
          disabled={submitting}
          onClick={onCancel}
        >
          {TEXTS.cancel}
        </SubmitButton>
      )}
      <SubmitButton
        type="submit"
        className="btn-font-s"
        disabled={submitting || (connected && !dirty)}
      >
        {submitLabel}
      </SubmitButton>
    </div>
  );
}
