import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";

import { useCreateProject, useInvitationReport } from "../../hooks";
import { useCreateProjectFormStore } from "../../store/createProjectFormStore";
import { SelectedUsers } from "../SelectedUsers";

import { AddParticipant } from "./AddParticipant";
import styles from "./CreateProjectForm.module.css";
import type { CreateProjectFormData } from "./schema";
import { CreateProjectSchema } from "./schema";

interface CreateProjectFormProps {
  /** Закрыть окно формы: проект создан */
  onSubmit: () => void;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const store = useCreateProjectFormStore();
  const { setName, setDescription, setEmails } = store;
  const { showInviteUser } = useGlobalModals();
  const { mutateAsync: createProject } = useCreateProject();
  const reportInvitations = useInvitationReport();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(CreateProjectSchema),
    mode: "onChange",
    defaultValues: { name: store.name, description: store.description },
  });

  // Поля — в черновике: окно выбора участников закрывает форму (createProjectFormStore.ts)
  const [name, description] = useWatch({ control, name: ["name", "description"] });

  useEffect(() => setName(name ?? ""), [name, setName]);
  useEffect(() => setDescription(description ?? ""), [description, setDescription]);

  const handleInviteUser = async () => {
    const emails = await showInviteUser({ emails: store.emails });

    if (emails) setEmails(emails);
  };

  const submitHandler = async (values: CreateProjectFormData) => {
    try {
      const { project, invitations } = await createProject({
        name: values.name,
        description: values.description || undefined,
        emails: store.emails,
      });

      store.reset();
      onSubmit();
      // Окно формы уже закрыто — результат приглашений можно показать своим окном
      reportInvitations(project.id, invitations);
    } catch {
      // Ошибку показал useCreateProject
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.formContainer}>
      <div className={styles.inputContainer}>
        <Input
          id="projectName"
          type="text"
          {...register("name")}
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

        {store.emails.length > 0 && (
          <SelectedUsers emails={store.emails} onDeleteUser={store.removeEmail} />
        )}
      </div>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? projectsTexts.creatingProject : projectsTexts.createProject}
      </SubmitButton>
    </form>
  );
}
