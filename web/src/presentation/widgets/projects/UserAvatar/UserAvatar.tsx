import Image from "next/image";

import styles from "./UserAvatar.module.css";
import { ASSETS } from "@/infrastructure/config/assets";

export function UserAvatar() {
  return (
    <div className={styles.container}>
      <Image
        className={styles.avatar}
        src={ASSETS.placeholder.image}
        alt="User Avatar"
        width={24}
        height={17}
      />
    </div>
  );
}
