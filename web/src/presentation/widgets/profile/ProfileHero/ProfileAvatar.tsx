import { forwardRef, useState } from "react";
import clsx from "clsx";

import styles from "./ProfileAvatar.module.css";

import { User } from "@/domain/user/user.entity";
import { UserAvatar } from "../UserAvatar";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { useUploadAvatar } from "@/application/user/hooks/useUploadAvatar";
import { ImageCropper } from "../ImageCropper";

interface ProfileAvatarProps {
  size?: "desktop" | "mobile";
  user: User;
  className?: string;
}

export const ProfileAvatar = forwardRef<HTMLDivElement, ProfileAvatarProps>(
  ({ size = "desktop", user, className }, ref) => {
    // Change avatar logic
    const { mutateAsync: updateAvatar } = useUploadAvatar();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const handleImageSelected = (file: File) => setSelectedFile(file);

    const handleCropComplete = async (formData: FormData) => {
      setSelectedFile(null);
      await updateAvatar(formData);
    };

    //TODO: show Image cropper in dialog

    const showCameraIcon = size === "mobile";
    return (
      <div ref={ref} className={clsx(className, styles.container)}>
        <UserAvatar
          avatarUrl={user?.avatarUrl}
          onImageSelected={handleImageSelected}
          className={styles[size]}
          showIcon={showCameraIcon}
        />
        {selectedFile && (
          <ImageCropper
            file={selectedFile}
            onCropComplete={handleCropComplete}
            onClose={() => setSelectedFile(null)}
          />
        )}
        <div className={styles.username}>
          <h3>{getDisplayName(user)}</h3>
          <span className="body-reg">{user.email}</span>
        </div>
      </div>
    );
  }
);

ProfileAvatar.displayName = "ProfileAvatar";
