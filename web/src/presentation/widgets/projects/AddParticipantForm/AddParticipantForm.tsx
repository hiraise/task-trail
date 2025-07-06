import styles from "./AddParticipantForm.module.css";
import { Input } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { UsersList } from "../UsersList";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { participantsTexts } from "./addParticipants";
import { useParticipantForm } from "../hooks/useParticipantForm";
import { ProjectParticipant } from "../types";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export type UserData = ProjectParticipant;

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
    submitParticipant,
  } = useParticipantForm();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
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

  const submitHandler = async (data: FormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
    submitParticipant(data.query);
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
          placeholder={participantsTexts.placeHolder}
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.query && (
          <FormFieldError>{errors.query.message}</FormFieldError>
        )}
      </div>
      {/* Show info message when no dropdown is shown */}
      {!shouldShowDropdown && (
        <span className={styles.infoMessage}>
          {participantsTexts.infoMessage}
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
        <SubmitButton
          type="submit"
          disabled={!isValid || isSubmitting}
          className={styles.button}
        >
          {isSubmitting
            ? participantsTexts.submitting
            : participantsTexts.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
