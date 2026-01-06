import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useCreateProjectFormStore } from "@/presentation/features/projects/store/createProjectFormStore";
import { SubmitButton } from "@/presentation/shared";
import { useClickOutside } from "@/presentation/shared/hooks/useClickOutside";
import { Input } from "@/presentation/shared/ui/Input";
import { TEXTS } from "@/shared/locales/texts";

import { SelectedUsers } from "../SelectedUsers";
import { UsersList } from "../UsersList";

import styles from "./AddParticipantForm.module.css";

interface FormValues {
  query: string;
}

interface AddParticipantFormProps {
  onSubmit?: (emails: string[]) => void | Promise<void>;
}

export function AddParticipantForm({ onSubmit }: AddParticipantFormProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Use a ref for the dropdown to handle clicks outside of it
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside([inputRef, dropdownRef], () => setShowDropdown(false));

  // Use the custom hook to access the project form state and methods
  const store = useCreateProjectFormStore();

  const emails = store.draft?.getMembers().map((member) => member.toString()) || [];

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { query: "" },
  });

  const queryValue = watch("query");

  const submitHandler = () => {
    if (!onSubmit || emails.length === 0) return;
    onSubmit(emails);
  };

  //TODO: replace (email: string) with propper DTO with user data

  const handleUserSelect = (email: string) => store.toggleParticipant(email);

  const handleUserDelete = (email: string) => store.removeParticipant(email);

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.container}>
      <div className={styles.form}>
        {/* Input field for user query */}
        <Controller
          name={"query"}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              ref={inputRef}
              id="query"
              type="text"
              placeholder={TEXTS.userQueryPlaceholder}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
          )}
        ></Controller>
      </div>
      {/* Show info message when no dropdown is shown */}
      {!showDropdown && <span className="caption-reg">{TEXTS.userInviteDescription}</span>}

      {/* Middle section that contains both dropdown and selected users */}
      {showDropdown && (
        <div className={styles.dropDown} ref={dropdownRef}>
          <UsersList
            onUserSelect={handleUserSelect}
            selectedUsers={emails}
            searchQuery={queryValue}
          />
        </div>
      )}
      {showDropdown && <div className={styles.middle} />}
      {emails.length > 0 && (
        <SelectedUsers emails={emails} onDeleteUser={handleUserDelete} isExpanded={!showDropdown} />
      )}

      <div className={styles.btnContainer}>
        <SubmitButton type="submit" className="btn-font-m" disabled={isSubmitting}>
          {TEXTS.projects.invite}
        </SubmitButton>
      </div>
    </form>
  );
}
