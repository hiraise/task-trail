import { useForm } from "react-hook-form";

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
    // watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: "onChange" });

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
      <div className={styles.content}>
        <UsersList />
        <SelectedUsers />
      </div>

      <div className={styles.spacer}></div>

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
