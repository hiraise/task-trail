export interface BaseModalProps<T = void> {
  isOpen: boolean;
  onClose: (result?: T) => void;
  onBack?: (result?: T) => void;
  fullScreen?: boolean;
}

export interface BaseModalComponentProps<T = void> extends BaseModalProps<T> {
  title?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
}
