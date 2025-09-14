import Image from "next/image";
import clsx from "clsx";

import styles from "./UserAvatar.module.css";
import { ASSETS } from "@/infrastructure/config/assets";

interface UserAvatarProps {
  className?: string;
  src?: string;
}

export function UserAvatar({ className, src = ASSETS.placeholder.image }: UserAvatarProps) {
  return (
    <div className={clsx(styles.container, className)}>
      <Image className={styles.avatar} src={src} alt="User Avatar" fill />
    </div>
  );
}
