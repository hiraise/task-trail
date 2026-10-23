import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { getUserDisplayName } from "@/domain/models/User";
import { FormFieldError, Input, PriorityIcon, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";
import { formatDueDate } from "@/shared/utils/dueDate";

import { useProject, useProjectMembers } from "../../../projects/hooks";
import { useCreateTask } from "../../hooks";
import { useCreateTaskFormStore } from "../../store/createTaskFormStore";

import styles from "./CreateTaskForm.module.css";
import { SelectionField } from "./FormSelectionOptions";
import type { CreateTaskFormData } from "./schema";
import { CreateTaskSchema } from "./schema";

interface CreateTaskFormProps {
  /** Close the form modal: the task is created */
  onSubmit: () => void;
}

export function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
  const store = useCreateTaskFormStore();
  const {
    projectId,
    assigneeId,
    allowedProjectIds,
    statusId,
    priority,
    dueDate,
    setName,
    setDescription,
    setProjectId,
    setAssigneeId,
    setPriority,
    setDueDate,
  } = store;
  const { showSelectAssignee, showSelectProject, showChangePriority, showChangeDueDate } =
    useGlobalModals();
  const { mutateAsync: createTask } = useCreateTask({ openTask: !statusId });
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId ?? "");
  const assignee = members?.find((member) => member.id === assigneeId);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(CreateTaskSchema),
    mode: "onChange",
    // The project is picked in its own modal — by then the form is remounted from the draft
    defaultValues: { name: store.name, description: store.description, projectId: projectId ?? "" },
  });

  // Fields live in the draft: the project and assignee pickers close the form (createTaskFormStore.ts)
  const [name, description] = useWatch({ control, name: ["name", "description"] });

  useEffect(() => setName(name ?? ""), [name, setName]);
  useEffect(() => setDescription(description ?? ""), [description, setDescription]);

  // The picker returns the project after the form is back on screen: the field follows the draft
  useEffect(() => {
    if (projectId) setValue("projectId", projectId, { shouldValidate: true });
  }, [projectId, setValue]);

  // Project changed — an assignee who is not its member is cleared: the server would reject them
  useEffect(() => {
    if (members && assigneeId && !members.some((member) => member.id === assigneeId)) {
      setAssigneeId(undefined);
    }
  }, [members, assigneeId, setAssigneeId]);

  const handleSelectAssignee = async () => {
    const member = await showSelectAssignee({ projectId, userId: assigneeId });

    if (member) setAssigneeId(member.id);
  };

  const handleSelectProject = async () => {
    const selected = await showSelectProject(projectId, allowedProjectIds);

    if (selected) setProjectId(selected.id);
  };

  const handleChangePriority = async () => {
    const selected = await showChangePriority({ priority });

    if (selected) setPriority(selected);
  };

  const handleChangeDueDate = async () => {
    const selected = await showChangeDueDate({ dueDate });

    // null — the date was removed or the field left empty
    if (selected !== undefined) setDueDate(selected ?? undefined);
  };

  const submitHandler = async (values: CreateTaskFormData) => {
    // The project from an old draft may be unavailable now: the user left it or it was deleted
    if (!project) {
      setError("projectId", { message: tasksTexts.requiredField });

      return;
    }

    try {
      await createTask({
        projectId: project.id,
        name: values.name,
        description: values.description || undefined,
        assigneeId: assignee?.id,
        statusId,
        priority,
        dueDate,
      });
      store.reset();
      onSubmit();
    } catch {
      // useCreateTask has shown the error
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
      <div className={styles.inputFields}>
        <Input
          id="taskName"
          {...register("name")}
          aria-invalid={!!errors.name}
          placeholder={tasksTexts.taskNamePlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
        <Textarea
          rows={3}
          id="taskDescription"
          {...register("description")}
          placeholder={tasksTexts.taskDescriptionPlaceholder}
          disabled={isSubmitting}
          autoComplete="off"
        />
        <SelectionField
          icon={ICONS.profile}
          placeholder={tasksTexts.assignee}
          value={assignee && getUserDisplayName(assignee)}
          onClick={handleSelectAssignee}
        />
        <SelectionField
          icon={ICONS.project}
          placeholder={tasksTexts.project}
          value={project?.name}
          invalid={!!errors.projectId}
          onClick={handleSelectProject}
        />
        {errors.projectId && <FormFieldError>{errors.projectId.message}</FormFieldError>}
        <SelectionField
          iconNode={<PriorityIcon priority={priority} size="18px" />}
          placeholder={tasksTexts.priority}
          value={tasksTexts.priorities[priority]}
          onClick={handleChangePriority}
        />
        <SelectionField
          icon={ICONS.calendar}
          placeholder={tasksTexts.dueDate}
          value={dueDate && formatDueDate(dueDate)}
          onClick={handleChangeDueDate}
        />
      </div>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? tasksTexts.submittingText : tasksTexts.buttonText}
      </SubmitButton>
    </form>
  );
}
