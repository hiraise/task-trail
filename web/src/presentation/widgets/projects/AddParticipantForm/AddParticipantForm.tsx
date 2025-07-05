import { useForm } from "react-hook-form";
import { useState } from "react";

import styles from "./AddParticipantForm.module.css";
import { Input } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { UsersList } from "../UsersList";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { participantsTexts } from "./addParticipants";

export type UserData = {
  id?: string;
  username?: string;
  email: string;
  avatarUrl?: string;
};

interface FormValues {
  query: string;
}

export function AddParticipantForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: "onChange" });

  // Watch the query input to show/hide the dropdown
  const queryValue = watch("query");
  const shouldShowDropdown = queryValue && queryValue.trim().length > 0;

  // Manage selected users state
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>(
    Array.from({ length: 10 }, (_, i) => ({
      email: `ilkat@gmail.com${i}`,
    }))
  );

  const handleDeleteUser = (user: UserData) => {
    setSelectedUsers((prevUsers) =>
      prevUsers.filter((u) => u.email !== user.email)
    );
  };

  const submitHandler = async (data: FormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
    alert(`Participant added: ${data.query}`);
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
            <UsersList />
          </div>
        )}
        {selectedUsers.length > 0 && (
          <SelectedUsers
            users={selectedUsers}
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
