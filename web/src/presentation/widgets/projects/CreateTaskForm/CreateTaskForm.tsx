import { Controller, useForm } from "react-hook-form";

import styles from "./CreateTaskForm.module.css";
import { FormValues } from "./CreateTaskForm.types";
import { Input, Textarea } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
// import { DropdownMenuAssignee } from "./DropdownMenuAssignee";
import { DropdownMenuProject } from "./DropdownMenuProject";
import { TaskDependenciesItem } from "../../tasks/TaskInfo/TaskDependenciesItem";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { useTaskModals } from "@/application/tasks/hooks/useTaskModals";

function SelectAssignee({ assignee }: { assignee: string }) {
  const { showSelectAssignee } = useTaskModals();
  return (
    <TaskDependenciesItem onClick={showSelectAssignee}>
      <Icon as={ICONS.profile} size="18px" />
      <span>{assignee}</span>
    </TaskDependenciesItem>
  );
}

const texts = {
  title: "Новая задача",
  taskNamePlaceholder: "Название задачи",
  taskDescriptionPlaceholder: "Описание задачи",
  assigneePlaceholder: "Выберите исполнителя",
  projectPlaceholder: "Выберите проект",
  buttonText: "Создать задачу",
  submittingText: "Создание задачи...",
};

interface Props {
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
}

export function CreateTaskForm({ onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      assignee: "",
      projectId: "",
    },
  });

  const submitHandler = async (data: FormValues) => {
    await onSubmit();
    alert("Submitted data: " + JSON.stringify(data, null, 2));
  };

  return (
    <div className={styles.container}>
      <p className={styles.title}>{texts.title}</p>
      <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
        <div className={styles.inputFields}>
          <Input
            {...register("name", { required: "Это поле обязательно" })}
            placeholder={texts.taskNamePlaceholder}
          />
          {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
          <Textarea
            rows={3}
            id="taskDescription"
            {...register("description")}
            aria-invalid={!!errors.description}
            aria-describedby="taskDescription-error"
            placeholder={texts.taskDescriptionPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
            className={styles.textarea}
          />
          {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
          {/* Assignee dropdown */}
          <Controller
            name={"assignee"}
            control={control}
            rules={{ required: "Это поле обязательно" }}
            render={({ field, fieldState }) => (
              <>
                {/* <DropdownMenuAssignee onSelect={field.onChange} /> */}
                <SelectAssignee assignee={field.value} />
                {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
              </>
            )}
          ></Controller>
          {/* Project dropdown */}
          <Controller
            name={"projectId"}
            control={control}
            rules={{ required: "Это поле обязательно" }}
            render={({ field, fieldState }) => (
              <>
                <DropdownMenuProject onSelect={field.onChange} />
                {fieldState.error && <FormFieldError>{fieldState.error.message}</FormFieldError>}
              </>
            )}
          ></Controller>
        </div>
        <SubmitButton disabled={!isValid || isSubmitting}>
          {isLoading ? texts.submittingText : texts.buttonText}
        </SubmitButton>
      </form>
    </div>
  );
}
