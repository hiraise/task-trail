import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { useCreateProjectFormStore } from "@/presentation/features/projects/store/createProjectFormStore";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { projectsTexts } from "@/shared/locales/projects";

import { useCreateProject } from "../../hooks";
import { SelectedUsers } from "../SelectedUsers";

import { AddParticipant } from "./AddParticipant";
import styles from "./CreateProjectForm.module.css";

const createProjectSchema = z.object({
  name: z
    .string()
    .min(6, "Project name must be at least 6 characters")
    .max(100, "Project name must not exceed 100 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    mode: "onChange",
    defaultValues: {
      name: store.draft?.getName() || "",
      description: store.draft?.getDescription() || "",
    },
  });

  const formValues = watch();

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
