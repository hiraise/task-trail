export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  fullScreen?: boolean;
}

export interface BaseModalComponentProps extends BaseModalProps {
  title?: string;
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
