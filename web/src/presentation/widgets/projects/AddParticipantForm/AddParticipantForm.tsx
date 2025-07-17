import { useEffect } from "react";
import { useForm } from "react-hook-form";

import styles from "./AddParticipantForm.module.css";
import { Input } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { UsersList } from "../UsersList";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { useParticipantForm } from "../../../../application/projects/hooks/useParticipantForm";
import { useBottomSheet } from "@/app/_components/BottomSheetContext";
import { projectsTexts } from "@/shared/locales/projects";

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

export function AddParticipantForm() {
  const {
    selectedParticipants,
    searchQuery,
    handleUserSelect,
    handleDeleteUser,
    setSearchQuery,
    inviteMembers,
  } = useParticipantForm();

  const { backSheet } = useBottomSheet();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: { query: searchQuery },
  });

  const queryValue = watch("query");
  const shouldShowDropdown = Boolean(
    queryValue && queryValue.trim().length > 0
  );

  // Sync form query with context
  useEffect(() => {
    setValue("query", searchQuery);
  }, [searchQuery, setValue]);

  useEffect(() => {
    if (queryValue !== searchQuery) {
      setSearchQuery(queryValue || "");
    }
  }, [queryValue, setSearchQuery, searchQuery]);

  const submitHandler = () => {
    inviteMembers();
    backSheet();
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.container}>
      <div className={styles.form}>
        <Input
          id="query"
          type="text"
          // TODO: Add validation for query
          {...register("query")}
          aria-invalid={!!errors.query}
          aria-describedby="query-error"
          placeholder={projectsTexts.inviteMembersPlaceHolder}
          autoComplete="off"
        />
        {errors.query && (
          <FormFieldError>{errors.query.message}</FormFieldError>
        )}
      </div>
      {/* Show info message when no dropdown is shown */}
      {!shouldShowDropdown && (
        <span className={styles.infoMessage}>
          {projectsTexts.inviteMemberInfo}
        </span>
      )}

      {/* Middle section that contains both dropdown and selected users */}
      <div className={styles.middle}>
        {shouldShowDropdown && (
          <div className={styles.dropDown}>
            <UsersList
              onUserSelect={handleUserSelect}
              selectedUsers={selectedParticipants}
              searchQuery={queryValue}
            />
          </div>
        )}
        {selectedParticipants.length > 0 && (
          <SelectedUsers
            users={selectedParticipants}
            onDeleteUser={handleDeleteUser}
            isExpanded={!shouldShowDropdown}
          />
        )}
      </div>

      <div className={styles.btnContainer}>
        <SubmitButton type="submit" className={styles.button}>
          {projectsTexts.inviteToProject}
        </SubmitButton>
      </div>
    </form>
  );
}
