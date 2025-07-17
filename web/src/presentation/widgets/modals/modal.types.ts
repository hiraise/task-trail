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
