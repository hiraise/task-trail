"use client";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { CreateProjectForm } from "@/presentation/widgets/projects/CreateProjectForm";

export default function CreateProjectModal(props: BaseModalProps) {
  const handleSubmit = () => {
    console.log("Create project submitted");
    props.onClose();
  };

  return (
    <BaseModal {...props} title="Новый проект">
      <CreateProjectForm onSubmit={handleSubmit} />
    </BaseModal>
  );
}
