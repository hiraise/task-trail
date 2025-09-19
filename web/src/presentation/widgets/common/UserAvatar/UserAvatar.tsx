import styles from "./UserAvatar.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import clsx from "clsx";

interface UserAvatarProps {
  variant?: "small" | "standard" | "large";
}

export function UserAvatar({ variant = "standard" }: UserAvatarProps) {
  const size = variant === "standard" ? "18px" : "20px";
  return (
    <div className={clsx(styles.avatar, styles[variant])}>
      <Icon as={ICONS.profile} size={size} />
    </div>
  );
}
