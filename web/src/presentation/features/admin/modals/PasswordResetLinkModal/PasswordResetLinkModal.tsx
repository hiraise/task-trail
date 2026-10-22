import { toast } from "sonner";

import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { PasswordResetLinkProps } from "@/presentation/shared/hooks/useGlobalModals";
import { adminTexts } from "@/shared/locales/admin";
import { formatDateTime } from "@/shared/utils/formatters";
import { interpolate } from "@/shared/utils/interpolate";

import styles from "./PasswordResetLinkModal.module.css";

const texts = adminTexts.resetLink;

async function copyLink(url: string) {
  try {
    // Буфер обмена есть только на https и localhost — иначе ссылку выделяют и копируют руками
    await navigator.clipboard.writeText(url);
    toast.success(texts.copied);
  } catch {
    toast.error(texts.copyFailed);
  }
}

/** Ссылка сброса пароля, которую администратор передаёт пользователю сам (ADR-0017). */
export function PasswordResetLinkModal(props: BaseModalProps<void>) {
  const { name, link } = useGlobalModalProps<PasswordResetLinkProps>() ?? {};

  if (!name || !link) return null;

  return (
    <BaseModal {...props} title="">
      <div className={styles.container}>
        <h2 className={styles.title}>{texts.title}</h2>
        <p className="body-reg">
          {interpolate(texts.description, { name, expiresAt: formatDateTime(link.expiresAt) })}
        </p>
        <output
          className={styles.link}
          onClick={(event) => window.getSelection()?.selectAllChildren(event.currentTarget)}
        >
          {link.url}
        </output>
        <div className={styles.buttons}>
          <SubmitButton variant="secondary" type="button" onClick={() => props.onClose()}>
            {texts.done}
          </SubmitButton>
          <SubmitButton type="button" onClick={() => copyLink(link.url)}>
            {texts.copy}
          </SubmitButton>
        </div>
      </div>
    </BaseModal>
  );
}
