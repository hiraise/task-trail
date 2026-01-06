export type IconButtonVariant = "primary" | "ghost" | "danger";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: IconButtonVariant;
  size?: string;
}
