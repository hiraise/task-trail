import clsx from "clsx";

import type { User } from "@/domain/models/User";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useUploadAvatar } from "../../hooks";
import { UserAvatar } from "../UserAvatar";

import styles from "./ProfileAvatar.module.css";

interface ProfileAvatarProps {
  user: User;
  className?: string;
  children: React.ReactNode;
}

/** Profile avatar: a tap picks an image, crops and uploads it. */
export function ProfileAvatar({ user, className, children }: ProfileAvatarProps) {
  const { mutate: updateAvatar } = useUploadAvatar();
  const { showCropImage } = useGlobalModals();

  const handleImageSelected = async (file: File) => {
    const result = await showCropImage(file);

    if (!result) return;
    updateAvatar({ avatarFile: result });
  };

  return (
    <div className={clsx(className, styles.container)}>
      <UserAvatar
        avatarUrl={user.avatarUrl}
        onImageSelected={handleImageSelected}
        className={styles.avatar}
        badgeClassName={styles.badge}
      />
      {children}
    </div>
  );
}
