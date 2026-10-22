import clsx from "clsx";

import { SubmitButton } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { Icon } from "@/presentation/shared/ui";
import { ICONS } from "@/shared/config/icons";
import { adminTexts } from "@/shared/locales/admin";

import { useDisableMail, useSendTestMail } from "../../hooks";

import styles from "./MailForm.module.css";

const texts = adminTexts.mail;

/** Тестовое письмо и отключение почты — работают с сохранёнными настройками. */
export function MailActions({ disabled }: { disabled: boolean }) {
  const { mutate: sendTest, isPending: sending } = useSendTestMail();
  const { mutate: disable, isPending: disabling } = useDisableMail();
  const { showConfirm } = useGlobalModals();

  const handleDisable = async () => {
    const confirmed = await showConfirm({
      title: texts.disableTitle,
      description: texts.disableDescription,
      confirmText: texts.disableConfirm,
    });

    if (confirmed) disable();
  };

  return (
    <div className={styles.actions}>
      <SubmitButton
        type="button"
        variant="text"
        className="btn-font-s"
        disabled={disabled || sending || disabling}
        onClick={() => sendTest()}
      >
        <Icon as={ICONS.mail} size="24px" inheritColor />
        {texts.sendTest}
      </SubmitButton>
      <SubmitButton
        type="button"
        variant="text"
        className={clsx("btn-font-s", styles.danger)}
        disabled={disabled || disabling}
        onClick={handleDisable}
      >
        <Icon as={ICONS.delete} size="24px" inheritColor />
        {texts.disable}
      </SubmitButton>
    </div>
  );
}
