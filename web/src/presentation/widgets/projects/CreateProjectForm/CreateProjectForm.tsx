import { useForm } from "react-hook-form";

import styles from "./CreateProjectForm.module.css";
import { Spacer } from "../../primitives/Spacer";
import { useModal } from "@/shared/hooks/useModal";
import { CreateProjectFormData, FormValues } from "./CreateProjectForm.types";
import { projectNameValidator } from "@/shared/utils/validate";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, Textarea } from "@/presentation/ui/Input";
import { AddParticipant } from "./AddParticipant";

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
    register,
    handleSubmit,
    // watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: "onChange" });

  const modal = useModal();

  // const projectName = watch("name");
  // const projectDescription = watch("description");
  // const participants = watch("participants");

  const submitHandler = async (data: FormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
    console.log("Form submitted with data:", data);
    return onSubmit({
      name: data.name,
      description: data.description,
      participants: data.participants,
    });
  };

  const handleOpenInviteUser = () => {
    modal.showInviteUser();
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
