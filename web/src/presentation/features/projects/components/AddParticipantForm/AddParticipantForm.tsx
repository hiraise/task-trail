import { useRef, useState } from "react";

import type { ProjectId } from "@/domain/types";
import { FormFieldError, SubmitButton } from "@/presentation/shared";
import { emailField, MAX_INVITE_EMAILS } from "@/presentation/shared/forms/fields";
import { usePublicSettings } from "@/presentation/shared/hooks";
import { useClickOutside } from "@/presentation/shared/hooks/useClickOutside";
import { Input } from "@/presentation/shared/ui/Input";
import { projectsTexts } from "@/shared/locales/projects";
import { TEXTS } from "@/shared/locales/texts";

import { SelectedUsers } from "../SelectedUsers";
import { UsersList } from "../UsersList";

import styles from "./AddParticipantForm.module.css";

interface AddParticipantFormProps {
  /** Проект, куда зовут; без него — новый проект */
  projectId?: ProjectId;
  /** Почты, выбранные раньше */
  initialEmails?: string[];
  onSubmit: (emails: string[]) => void;
}

// Почту сервер приводит к нижнему регистру и обрезает (ADR-0016) — веб сравнивает так же
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Выбор, кого позвать: кандидаты из общих проектов и любая почта. Enter в поле добавляет
 * введённую почту к выбранным, кнопка зовёт всех выбранных вместе с введённой.
 */
export function AddParticipantForm({
  projectId,
  initialEmails = [],
  onSubmit,
}: AddParticipantFormProps) {
  const [emails, setEmails] = useState(initialEmails);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: settings } = usePublicSettings();
  const hint = settings?.mailEnabled === false ? projectsTexts.inviteHintNoMail : projectsTexts.inviteHint;

  useClickOutside([inputRef, dropdownRef], () => setShowDropdown(false));

  const typedEmail = (): string | undefined => {
    const email = normalizeEmail(query);

    return emailField.safeParse(email).success ? email : undefined;
  };

  const toggle = (value: string) => {
    const email = normalizeEmail(value);

    setError(undefined);
    setEmails((prev) =>
      prev.includes(email) ? prev.filter((selected) => selected !== email) : [...prev, email],
    );
    if (email === normalizeEmail(query)) setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const email = typedEmail();

    if (email && !emails.includes(email)) toggle(email);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const email = typedEmail();
    const all = email && !emails.includes(email) ? [...emails, email] : emails;

    if (all.length === 0) return;
    if (all.length > MAX_INVITE_EMAILS) {
      setError(projectsTexts.tooManyEmails);

      return;
    }
    onSubmit(all);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.form}>
        <Input
          ref={inputRef}
          id="query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={TEXTS.userQueryPlaceholder}
          autoComplete="off"
        />
        {error && <FormFieldError>{error}</FormFieldError>}
      </div>

      {!showDropdown && <span className="caption-reg">{hint}</span>}

      {showDropdown && (
        <div className={styles.dropDown} ref={dropdownRef}>
          <UsersList
            projectId={projectId}
            onUserSelect={toggle}
            selectedUsers={emails}
            searchQuery={query}
          />
        </div>
      )}
      {showDropdown && <div className={styles.middle} />}
      {emails.length > 0 && (
        <SelectedUsers emails={emails} onDeleteUser={toggle} isExpanded={!showDropdown} />
      )}

      <div className={styles.btnContainer}>
        <SubmitButton type="submit" className="btn-font-m">
          {TEXTS.projects.invite}
        </SubmitButton>
      </div>
    </form>
  );
}
