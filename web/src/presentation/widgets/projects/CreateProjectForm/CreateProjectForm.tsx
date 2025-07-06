import styles from "./CreateProjectForm.module.css";
import { Spacer } from "../../primitives/Spacer";
import { CreateProjectFormData, FormValues } from "./CreateProjectForm.types";
import { projectNameValidator } from "@/shared/utils/validate";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, Textarea } from "@/presentation/ui/Input";
import { AddParticipant } from "./AddParticipant";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { useCreateProjectForm } from "../hooks/useCreateProjectForm";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

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
    projectName,
    projectDescription,
    selectedParticipants,
    handleRemoveParticipant,
    handleOpenInviteUser,
    setProjectName,
    setProjectDescription,
    submitProject,
  } = useCreateProjectForm({ onSubmit });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: projectName,
      description: projectDescription,
      participants: selectedParticipants.map((p) => p.email),
    },
  });

  // Watch form values and sync with context
  const watchedName = watch("name");
  const watchedDescription = watch("description");

  // Sync form values with context state
  useEffect(() => {
    setValue("name", projectName);
    setValue("description", projectDescription);
    setValue(
      "participants",
      selectedParticipants.map((p) => p.email)
    );
  }, [projectName, projectDescription, selectedParticipants, setValue]);

  // Update context when form values change
  useEffect(() => {
    if (watchedName !== projectName) {
      setProjectName(watchedName || "");
    }
    if (watchedDescription !== projectDescription) {
      setProjectDescription(watchedDescription || "");
    }
  }, [
    watchedName,
    watchedDescription,
    setProjectName,
    setProjectDescription,
    projectName,
    projectDescription,
  ]);

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
            onDeleteUser={(user) => handleRemoveParticipant(user.email)}
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
