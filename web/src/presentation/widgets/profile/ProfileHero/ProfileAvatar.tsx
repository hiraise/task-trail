import { forwardRef } from "react";
import clsx from "clsx";

import styles from "./ProfileAvatar.module.css";

import { User } from "@/domain/user/user.entity";
import { UserAvatar } from "../UserAvatar";
import { useUploadAvatar } from "@/application/user/hooks/useUploadAvatar";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

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
      await updateAvatar(result);
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
  }
);

ProfileAvatar.displayName = "ProfileAvatar";
