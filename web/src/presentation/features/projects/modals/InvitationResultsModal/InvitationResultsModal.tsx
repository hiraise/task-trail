import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";

import type { InvitationResult } from "@/domain/models/Invitation";
import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, Input, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { InvitationResultsProps } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";

import { useAddMembers } from "../../hooks";

import styles from "./InvitationResultsModal.module.css";

const texts = projectsTexts.invitations;

const statusText = (result: InvitationResult): string => {
  switch (result.outcome) {
    case "added":
      return texts.added;
    case "invited":
      return result.inviteUrl ? texts.invitedNoMail : texts.invited;
    case "already_member":
      return texts.alreadyMember;
    case "mail_failed":
      return texts.mailFailed;
  }
};

async function copyLink(url: string) {
  try {
    // Буфер обмена есть только на https и localhost — иначе ссылку копируют из поля руками
    await navigator.clipboard.writeText(url);
    toast.success(texts.linkCopied);
  } catch {
    toast.error(texts.copyFailed);
  }
}

/**
 * Результат приглашения по каждой почте (ADR-0017): без почты сервиса — ссылки, которые
 * пригласивший отправляет сам; письмо не ушло — «Пригласить снова» создаёт новое приглашение
 * и шлёт новое письмо. Открывает его useInvitationReport, когда тосту не хватает места.
 */
export function InvitationResultsModal(props: BaseModalProps<void>) {
  const { projectId, results: initial = [] } =
    useGlobalModalProps<InvitationResultsProps>() ?? {};
  const [results, setResults] = useState(initial);
  const { mutateAsync: addMembers, isPending } = useAddMembers({ report: false });

  const failed = results.filter((result) => result.outcome === "mail_failed");
  const hasLinks = results.some((result) => result.inviteUrl);

  const inviteAgain = async () => {
    if (!projectId) return;
    try {
      const retried = await addMembers({ projectId, emails: failed.map((r) => r.email) });
      const byEmail = new Map(retried.map((result) => [result.email, result]));

      setResults((prev) => prev.map((result) => byEmail.get(result.email) ?? result));
    } catch {
      // Ошибку показал useAddMembers
    }
  };

  return (
    <BaseModal {...props} title={texts.title}>
      <div className={styles.container}>
        {hasLinks && <p className={clsx("body-reg-2", styles.hint)}>{texts.noMailHint}</p>}
        {failed.length > 0 && (
          <p className={clsx("body-reg-2", styles.hint)}>{texts.mailFailedHint}</p>
        )}

        <ul className={styles.list}>
          {results.map((result) => (
            <li key={result.email} className={styles.item}>
              <div className={styles.row}>
                <span className={clsx("body-reg", styles.email)}>{result.email}</span>
                <span
                  className={clsx(
                    "caption-reg",
                    styles.status,
                    result.outcome === "mail_failed" && styles.failed,
                  )}
                >
                  {statusText(result)}
                </span>
              </div>
              {result.inviteUrl && (
                <div className={styles.link}>
                  <Input
                    readOnly
                    value={result.inviteUrl}
                    aria-label={`${texts.invitedNoMail}: ${result.email}`}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <SubmitButton
                    type="button"
                    variant="secondary"
                    className={styles.copy}
                    onClick={() => copyLink(result.inviteUrl!)}
                  >
                    {texts.copyLink}
                  </SubmitButton>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.buttons}>
          {failed.length > 0 && (
            <SubmitButton variant="secondary" disabled={isPending} onClick={inviteAgain}>
              {texts.inviteAgain}
            </SubmitButton>
          )}
          <SubmitButton onClick={() => props.onClose()}>{texts.done}</SubmitButton>
        </div>
      </div>
    </BaseModal>
  );
}
