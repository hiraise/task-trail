export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

export interface BaseModalComponentProps extends BaseModalProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

export interface CreateProjectModalProps extends BaseModalProps {
  initialData?: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
  };
}

export interface InviteUserModalProps extends BaseModalProps {
  defaultRole?: string;
  maxInvites?: number;
}
