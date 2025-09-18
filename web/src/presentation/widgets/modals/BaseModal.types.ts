export interface BaseModalProps<T = void> {
  isOpen: boolean;
  onClose: (result?: T) => void;
  onBack?: (result?: T) => void;
  fullScreen?: boolean;
}

export interface BaseModalComponentProps<T = void> extends BaseModalProps<T> {
  title?: string;
  children: React.ReactNode;
  /**
   * Controls whether to show the back button.
   * If undefined, automatically determined based on modal stack depth:
   * - Shows back button when stack.length > 1
   * - Hides back button when stack.length <= 1
   * - Can be explicitly set to true/false to override automatic behavior
   */
  showBackButton?: boolean;
}
