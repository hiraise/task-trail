import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { getUserDisplayName } from "@/domain/models/User";
import { FormFieldError, Input, SubmitButton, Textarea } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { tasksTexts } from "@/shared/locales/tasks";

import { useProject, useProjectMembers } from "../../../projects/hooks";
import { useCreateTask } from "../../hooks";
import { useCreateTaskFormStore } from "../../store/createTaskFormStore";

import styles from "./CreateTaskForm.module.css";
import { SelectionField } from "./FormSelectionOptions";
import type { CreateTaskFormData } from "./schema";
import { CreateTaskSchema } from "./schema";

interface CreateTaskFormProps {
  /** Закрыть окно формы: задача создана */
  onSubmit: () => void;
}

export function CreateTaskForm({ onSubmit }: CreateTaskFormProps) {
  const store = useCreateTaskFormStore();
  const { projectId, assigneeId, setName, setDescription, setProjectId, setAssigneeId } = store;
  const { showSelectAssignee, showSelectProject } = useGlobalModals();
  const { mutateAsync: createTask } = useCreateTask();
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId ?? "");
  const assignee = members?.find((member) => member.id === assigneeId);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(CreateTaskSchema),
    mode: "onChange",
    // Проект выбирают в своём окне — форма к тому времени уже смонтирована заново из черновика
    defaultValues: { name: store.name, description: store.description, projectId: projectId ?? "" },
  });

  // Поля — в черновике: окна выбора проекта и ответственного закрывают форму (createTaskFormStore.ts)
  const [name, description] = useWatch({ control, name: ["name", "description"] });

  useEffect(() => setName(name ?? ""), [name, setName]);
  useEffect(() => setDescription(description ?? ""), [description, setDescription]);

  // Сменили проект — ответственный, который не его участник, снимается: сервер его не примет
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
    const selected = await showSelectProject(projectId);

    if (selected) setProjectId(selected.id);
  };

  const submitHandler = async (values: CreateTaskFormData) => {
    // Проект из старого черновика мог стать недоступен: из него вышли или его удалили
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
      });
      store.reset();
      onSubmit();
    } catch {
      // Ошибку показал useCreateTask
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
      </div>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? tasksTexts.submittingText : tasksTexts.buttonText}
      </SubmitButton>
    </form>
  );
}
