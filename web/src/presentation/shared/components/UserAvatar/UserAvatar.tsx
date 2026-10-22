import clsx from "clsx";

import { ICONS } from "@/shared/config/icons";
import { initials } from "@/shared/utils/initials";

import { Icon } from "../../ui";

import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
  variant?: "small" | "standard" | "large";
  /** Адрес аватарки (User.avatarUrl) */
  src?: string;
  /** Имя или почта: без аватарки — инициалы, как в макете */
  name?: string;
}

const ICON_SIZE = { small: "18px", standard: "20px", large: "24px" };

export function UserAvatar({ variant = "standard", src, name }: UserAvatarProps) {
  const letters = name ? initials(name) : "";

  return (
    <div className={clsx(styles.avatar, styles[variant])} title={name}>
      {src ? (
        <img className={styles.image} src={src} alt="" />
      ) : letters ? (
        <span className={styles.initials}>{letters}</span>
      ) : (
        <Icon as={ICONS.profile} size={ICON_SIZE[variant]} />
      )}
    </div>
  );
}
