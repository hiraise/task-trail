import { useForm } from "react-hook-form";

import styles from "./CreateProjectForm.module.css";
import { Spacer } from "../../primitives/Spacer";
import { projectNameValidator } from "@/shared/utils/validate";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, Textarea } from "@/presentation/ui/Input";
import { AddParticipant } from "./AddParticipant";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { projectsTexts } from "@/shared/locales/projects";
import { ProjectPayload } from "@/domain/project/project.payload";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

interface CreateProjectFormProps {
  onSubmit: () => void;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const { showInviteUser } = useGlobalModals();
  const emails: string[] = [];
  const toogleMember = () => {};

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ProjectPayload>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      participants: [],
    },
  });

  // Handle form submission and validation
  const submitHandler = async (data: ProjectPayload) => {
    const projectData: ProjectPayload = data;
    console.log("Final project data with participants:", projectData);
    onSubmit();
  };

  const handleInviteUser = async () => {
    const emails = await showInviteUser();
    if (!emails || emails.length === 0) return;
    console.log("Invited emails:", emails);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.formContainer}>
      <div className={styles.inputContainer}>
        <Input
          id="projectName"
          type="text"
          {...register("name", {
            ...projectNameValidator,
          })}
          aria-invalid={!!errors.name}
          aria-describedby="projectName-error"
          placeholder={projectsTexts.projectNamePlaceholder}
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
          placeholder={projectsTexts.projectDescriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
          className={styles.textarea}
        />
        {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
        <AddParticipant onClick={handleInviteUser} />

        {/* Display selected participants */}
        {emails && emails.length > 0 && (
          <SelectedUsers emails={emails} onDeleteUser={toogleMember} />
        )}
      </div>
      <Spacer size="24px" />
      <SubmitButton type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? projectsTexts.creatingProject : projectsTexts.createProject}
      </SubmitButton>
    </form>
  );
}
