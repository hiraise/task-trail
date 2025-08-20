import { useForm } from "react-hook-form";

import styles from "./CreateProjectForm.module.css";
import { Spacer } from "../../primitives/Spacer";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { Input, Textarea } from "@/presentation/ui/Input";
import { AddParticipant } from "./AddParticipant";
import { SelectedUsers } from "../SelectedUsers/SelectedUsers";
import { projectsTexts } from "@/shared/locales/projects";
import { ProjectPayload } from "@/domain/project/project.payload";
import { useCreateProjectForm } from "@/application/projects/hooks/useCreateProjectForm";
import { projectNameValidator } from "@/shared/utils/validate";
import { UserData } from "../AddParticipantForm/AddParticipantForm";

interface CreateProjectFormProps {
  onSubmit: () => void;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const { state, setState, toggleParticipant, submitForm, handleInviteUser } =
    useCreateProjectForm();
  const emails = state.participants;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectPayload>({
    mode: "onChange",
    defaultValues: {
      name: state.name,
      description: state.description,
      participants: state.participants,
    },
  });

  const submitHandler = async (data: ProjectPayload) => {
    await submitForm(data);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.formContainer}>
      <div className={styles.inputContainer}>
        <Input
          id="projectName"
          type="text"
          {...register("name", {
            ...projectNameValidator,
            onChange: (e) => setState({ name: e.target.value }),
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
          {...register("description", {
            onChange: (e) => setState({ description: e.target.value }),
          })}
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
          <SelectedUsers
            emails={emails}
            onDeleteUser={(user: UserData) => toggleParticipant(user.email)}
          />
        )}
      </div>
      <Spacer size="24px" />
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? projectsTexts.creatingProject : projectsTexts.createProject}
      </SubmitButton>
    </form>
  );
}
