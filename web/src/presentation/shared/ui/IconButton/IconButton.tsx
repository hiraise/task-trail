"use client";

import clsx from "clsx";

import { Icon } from "../Icon";

import styles from "./IconButton.module.css";

type IconButtonVariant = "primary" | "ghost" | "danger";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: IconButtonVariant;
  size?: string;
}

export function IconButton({
  icon,
  variant = "primary",
  size = "24px",
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const buttonClasses = clsx(styles.iconButton, styles[`iconButton--${variant}`], className);

  return (
    <button className={buttonClasses} disabled={disabled} {...rest}>
      <Icon as={icon} size={size} inheritColor />
    </button>
  );
}
