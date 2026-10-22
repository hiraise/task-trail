import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { errorMessage } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { projectsTexts } from "@/shared/locales/projects";
import { interpolate } from "@/shared/utils/interpolate";
import { suggestProjectKey } from "@/shared/utils/projectKey";

import { useCreateProject, useInvitationReport } from "../../hooks";
import { useCreateProjectFormStore } from "../../store/createProjectFormStore";
import { ProjectKeyField } from "../ProjectKeyField";
import { SelectedUsers } from "../SelectedUsers";

import { AddParticipant } from "./AddParticipant";
import styles from "./CreateProjectForm.module.css";
import type { CreateProjectFormData } from "./schema";
import { CreateProjectSchema } from "./schema";

interface CreateProjectFormProps {
  /** Close the form modal: the project is created */
  onSubmit: () => void;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const store = useCreateProjectFormStore();
  const { setName, setDescription, setKey, setEmails } = store;
  const { showInviteUser } = useGlobalModals();
  const { mutateAsync: createProject } = useCreateProject();
  const reportInvitations = useInvitationReport();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(CreateProjectSchema),
    mode: "onChange",
    defaultValues: { name: store.name, description: store.description, key: store.key },
  });

  // Fields live in the draft: the member picker closes the form (createProjectFormStore.ts)
  const [name, description, key] = useWatch({ control, name: ["name", "description", "key"] });

  useEffect(() => setName(name ?? ""), [name, setName]);
  useEffect(() => setDescription(description ?? ""), [description, setDescription]);

  // Until the user types the key, it follows the name
  const keyEdited = useCreateProjectFormStore((state) => state.keyEdited);

  useEffect(() => {
    if (keyEdited) return;
    const suggested = suggestProjectKey(name ?? "");

    setValue("key", suggested, { shouldValidate: suggested !== "" });
    setKey(suggested, false);
  }, [name, keyEdited, setValue, setKey]);

  const keyField = register("key", {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setKey(event.target.value, true),
  });
  const keyPreview = (key ?? "").trim().toUpperCase();

  const handleInviteUser = async () => {
    const emails = await showInviteUser({ emails: store.emails });

    if (emails) setEmails(emails);
  };

  const submitHandler = async (values: CreateProjectFormData) => {
    try {
      const { project, invitations } = await createProject({
        name: values.name,
        description: values.description || undefined,
        key: values.key,
        emails: store.emails,
      });

      store.reset();
      onSubmit();
      // The form modal is closed — the invitation result can be shown in its own modal
      reportInvitations(project.id, invitations);
    } catch (error) {
      // A taken key is shown under its field; useCreateProject has shown the other errors
      if (hasErrorCode(error, "PROJECT_KEY_TAKEN")) {
        setError("key", { message: errorMessage(error, projectsTexts.createProjectFailed) });
      }
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
        <ProjectKeyField
          {...keyField}
          disabled={isSubmitting}
          error={errors.key?.message}
          hint={keyPreview ? interpolate(projectsTexts.keyHint, { key: keyPreview }) : undefined}
        />
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
