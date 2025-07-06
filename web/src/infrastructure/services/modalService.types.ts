import { BaseModalProps } from "@/presentation/widgets/modals/modal.types";

export interface ModalService {
  showCreateProject: CreateProject;
  showInviteUser: InviteUser;
  close: () => void;
  closeAll: () => void;
}

export type CreateProject = (props?: Partial<BaseModalProps>) => void;
export type InviteUser = (props?: Partial<BaseModalProps>) => void;
