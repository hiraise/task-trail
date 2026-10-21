import type { ComponentType, SVGProps } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
  isVisible: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  color?: string;
}
