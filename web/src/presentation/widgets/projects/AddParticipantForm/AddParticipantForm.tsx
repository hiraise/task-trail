import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import styles from "./AddParticipantForm.module.css";
import { Input } from "@/presentation/ui/Input";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { UsersList } from "../UsersList";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { useParticipantForm } from "../../../../application/projects/hooks/useParticipantForm";
import { useBottomSheet } from "@/app/_components/BottomSheetContext";
import { projectsTexts } from "@/shared/locales/projects";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

export interface BaseUserData {
  email: string;
}
export interface UserData extends BaseUserData {
  username?: string;
  avatarUrl?: string;
}

interface FormValues {
  query: string;
}

interface AddParticipantFormProps {
  onSubmit?: (emails: string[]) => void | Promise<void>;
}

export function AddParticipantForm({ onSubmit }: AddParticipantFormProps) {
  const {
    selectedParticipants,
    handleUserSelect,
    handleDeleteUser,
    inviteMembers,
  } = useParticipantForm();

  const { backSheet } = useBottomSheet();
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Use a ref for the dropdown to handle clicks outside of it
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside([inputRef, dropdownRef], () => setShowDropdown(false));

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

  const submitHandler = async () => {
    if (!onSubmit) {
      inviteMembers();
      backSheet();
      return;
    }
    const selectedEmails = selectedParticipants.map((user) => user.email);
    if (selectedEmails.length > 0) await onSubmit(selectedEmails);
    backSheet();
  };

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
              placeholder={projectsTexts.inviteMembersPlaceHolder}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
          )}
        ></Controller>
      </div>
      {/* Show info message when no dropdown is shown */}
      {!showDropdown && (
        <span className={styles.infoMessage}>
          {projectsTexts.inviteMemberInfo}
        </span>
      )}

      {/* Middle section that contains both dropdown and selected users */}

      {showDropdown && (
        <div className={styles.dropDown} ref={dropdownRef}>
          <UsersList
            onUserSelect={handleUserSelect}
            selectedUsers={selectedParticipants}
            searchQuery={queryValue}
          />
        </div>
      )}
      {showDropdown && <div className={styles.middle} />}
      {selectedParticipants.length > 0 && (
        <SelectedUsers
          users={selectedParticipants}
          onDeleteUser={handleDeleteUser}
          isExpanded={!showDropdown}
        />
      )}

      <div className={styles.btnContainer}>
        <SubmitButton
          type="submit"
          className={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? projectsTexts.invitingToProject
            : projectsTexts.inviteToProject}
        </SubmitButton>
      </div>
    </form>
  );
}
