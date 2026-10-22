import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal } from "@/presentation/shared";

import { CreateProjectForm } from "../../components/CreateProjectForm";

export function CreateProjectModal(props: BaseModalProps) {
  return (
    <BaseModal {...props} title="Новый проект">
      <CreateProjectForm onSubmit={() => props.onClose()} />
    </BaseModal>
  );
}
