import clsx from "clsx";

import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";

import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
  variant?: "small" | "standard" | "large";
}

export function UserAvatar({ variant = "standard" }: UserAvatarProps) {
  let size: string;
  switch (variant) {
    case "small":
      size = "18px";
      break;
    case "standard":
      size = "20px";
      break;
    case "large":
      size = "24px";
      break;

    default:
      size = "20px";
      break;
  }

  return (
    <div className={clsx(styles.avatar, styles[variant])}>
      <Icon as={ICONS.profile} size={size} />
    </div>
  );
}
