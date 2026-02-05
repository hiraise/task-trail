import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";

import { useCreateProject } from "../../hooks";
import { useCreateProjectFormStore } from "../../store/createProjectFormStore";
import { SelectedUsers } from "../SelectedUsers";

import { AddParticipant } from "./AddParticipant";
import styles from "./CreateProjectForm.module.css";
import type { CreateProjectFormData } from "./schema";
import { CreateProjectSchema } from "./schema";

interface CreateProjectFormProps {
  onSubmit: () => void;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const store = useCreateProjectFormStore();
  const { showInviteUser } = useGlobalModals();

  const { mutateAsync: createProject } = useCreateProject();

  useEffect(() => {
    store.initialize();
  }, [store]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(CreateProjectSchema),
    mode: "onChange",
    defaultValues: {
      name: store.draft?.getName() || "",
      description: store.draft?.getDescription() || "",
    },
  });

  const formValues = useWatch({ control });

  // Sync name with state
  useEffect(() => {
    if (formValues.name !== undefined && formValues.name !== store.draft?.getName()) {
      store.setName(formValues.name);
    }
  }, [formValues.name, store]);

  // Sync description with state
  useEffect(() => {
    if (
      formValues.description !== undefined &&
      formValues.description !== store.draft?.getDescription()
    ) {
      store.setDescription(formValues.description || "");
    }
  }, [formValues.description, store]);

  const handleInviteUser = async () => {
    const emails = await showInviteUser();

    if (emails && emails.length > 0) {
      store.setParticipants(emails);
    }
  };

  const submitHandler = async () => {
    if (!store.draft) return;
    const dto = store.draft.toPersistenceDto();

    await createProject(dto);
    store.reset();
    onSubmit();
  };

  const emails = store.draft?.getMembers().map((member) => member.toString()) || [];

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

        {/* Display selected participants */}
        {emails.length > 0 && (
          <SelectedUsers emails={emails} onDeleteUser={(email) => store.removeParticipant(email)} />
        )}
      </div>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? projectsTexts.creatingProject : projectsTexts.createProject}
      </SubmitButton>
    </form>
  );
}
