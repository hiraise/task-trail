import clsx from "clsx";
import { forwardRef } from "react";

import type { User } from "@/domain/models/User";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useUploadAvatar } from "../../hooks";
import { UserAvatar } from "../UserAvatar";

import styles from "./ProfileAvatar.module.css";

interface ProfileAvatarProps {
  size?: "desktop" | "mobile";
  user: User;
  className?: string;
  children: React.ReactNode;
}

export const ProfileAvatar = forwardRef<HTMLDivElement, ProfileAvatarProps>(
  ({ size = "desktop", user, className, children }, ref) => {
    const { mutateAsync: updateAvatar } = useUploadAvatar();
    const { showCropImage } = useGlobalModals();

    const handleImageSelected = async (file: File) => {
      const result = await showCropImage(file);

      if (!result) return;
      await updateAvatar({ avatarFile: result });
    };

    const showCameraIcon = size === "mobile";

    return (
      <div ref={ref} className={clsx(className, styles.container)}>
        <UserAvatar
          avatarUrl={user?.avatarUrl}
          onImageSelected={handleImageSelected}
          className={styles[size]}
          showIcon={showCameraIcon}
        />
        {children}
      </div>
    );
  },
);

ProfileAvatar.displayName = "ProfileAvatar";
