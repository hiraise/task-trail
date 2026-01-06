"use client";
import { useEffect } from "react";

import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";

import { CreateProjectForm } from "../../components/CreateProjectForm";
import { useCreateProjectFormStore } from "../../store/createProjectFormStore";

export function CreateProjectModal(props: BaseModalProps) {
  const store = useCreateProjectFormStore();

  useEffect(() => {
    store.initialize();
  }, [store]);

  const handleSubmit = () => {
    props.onClose();
  };

  return (
    <BaseModal {...props} title="Новый проект">
      <CreateProjectForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
