export interface MenuItem {
  label: string;
  onClick: () => void;
  isVisible: boolean;
  icon?: React.FC<React.SVGProps<SVGElement>>;
  color?: string;
}
