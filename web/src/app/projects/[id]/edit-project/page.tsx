"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAppSelector } from "@/infrastructure/redux/hooks";

import "./styles.css";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { BackButton } from "@/presentation/ui/BackButton";
import { Input, InputLabel, Textarea } from "@/presentation/ui/Input";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { useProjects } from "@/application/projects/hooks/useProjects";

const texts = {
  title: "Редактировать проект",
  nameLabel: "Название проекта",
  namePlaceholder: "Введите название проекта",
  descriptionLabel: "Описание проекта",
  descriptionPlaceholder: "Введите описание проекта",
  buttonText: "Сохранить",
  submittingText: "Сохранение...",
};

type FormValues = {
  name: string;
  description?: string;
};

export default function EditProjectPage() {
  const project = useAppSelector((state) => state.project.project);

  const { edit } = useProjects();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      name: project?.name,
      description: project?.description,
    },
  });

  // Reset form values when project changes
  useEffect(() => {
    if (project) {
      reset({ name: project?.name, description: project?.description });
    }
  }, [project, reset]);

  const submitHandler = async (data: FormValues) => {
    if (!project) return;
    await edit(project.id, {
      name: data.name,
      description: data.description,
    });
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="container">
        <BackButton />
      </div>
      <div className="content">
        <h1 className="title">{texts.title}</h1>
        <form className="form" onSubmit={handleSubmit(submitHandler)}>
          <div className="input">
            <InputLabel className="label" htmlFor="name">
              {texts.nameLabel}
            </InputLabel>
            <Input
              id="name"
              type="name"
              placeholder={texts.namePlaceholder}
              {...register("name", { required: "Это поле обязательно" })}
            />
            {errors.name && <FormFieldError>{errors.name.message}</FormFieldError>}
          </div>
          <div className="input">
            <InputLabel className="label">{texts.descriptionLabel}</InputLabel>
            <Textarea
              rows={3}
              id="description"
              aria-invalid={!!errors.description}
              aria-describedby="description-error"
              placeholder={texts.descriptionPlaceholder}
              disabled={isSubmitting}
              autoComplete="off"
              className="textarea"
              {...register("description")}
            />
            {errors.description && <FormFieldError>{errors.description.message}</FormFieldError>}
          </div>
          <SubmitButton onClick={handleSubmit(submitHandler)} disabled={!isValid || isSubmitting}>
            {isSubmitting ? texts.submittingText : texts.buttonText}
          </SubmitButton>
        </form>
      </div>
    </MainContainer>
  );
}
