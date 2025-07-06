import { useForm } from "react-hook-form";

import styles from "./CreateProjectForm.module.css";
import { Spacer } from "../../primitives/Spacer";
import { CreateProjectFormData } from "../../../../application/projects/types";
import { FormValues } from "./CreateProjectForm.types";
import { projectNameValidator } from "@/shared/utils/validate";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, Textarea } from "@/presentation/ui/Input";
import { AddParticipant } from "./AddParticipant";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { useCreateProjectForm } from "../../../../application/projects/hooks/useCreateProjectForm";

const projectFormTexts = {
  newProject: "Новый проект",
  projectNamePlaceholder: "Название проекта",
  projectDescriptionPlaceholder: "Описание проекта",
  inviteParticipants: "Пригласить участника ",
  createProject: "Создать проект",
  creatingProject: "Создание проекта...",
};

interface Props {
  onSubmit: (data: CreateProjectFormData) => void | Promise<void>;
  isLoading?: boolean;
}

export function CreateProjectForm({ onSubmit, isLoading }: Props) {
  const {
    selectedParticipants,
    removeParticipant,
    handleOpenInviteUser,
    submitProject,
  } = useCreateProjectForm({ onSubmit });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      participants: [],
    },
  });

  const submitHandler = async (data: FormValues) => {
    await submitProject(data);
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className={styles.formContainer}
    >
      <p className={styles.title}>{projectFormTexts.newProject}</p>
      <Spacer size="16px" />
      <div className={styles.inputContainer}>
        <Input
          id="projectName"
          type="text"
          {...register("name", projectNameValidator)}
          aria-invalid={!!errors.name}
          aria-describedby="projectName-error"
          placeholder={projectFormTexts.projectNamePlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        <Textarea
          rows={3}
          id="projectDescription"
          {...register("description")}
          aria-invalid={!!errors.description}
          aria-describedby="projectDescription-error"
          placeholder={projectFormTexts.projectDescriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          className={styles.textarea}
        />
        {errors.description && (
          <FormFieldError>{errors.description.message}</FormFieldError>
        )}
        <AddParticipant onClick={handleOpenInviteUser} />

        {/* Display selected participants */}
        {selectedParticipants.length > 0 && (
          <SelectedUsers
            users={selectedParticipants}
            onDeleteUser={(user) => removeParticipant(user.email)}
          />
        )}
      </div>
      <Spacer size="24px" />
      <SubmitButton type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting || isLoading
          ? projectFormTexts.creatingProject
          : projectFormTexts.createProject}
      </SubmitButton>
    </form>
  );
}
