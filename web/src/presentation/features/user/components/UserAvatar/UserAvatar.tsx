import clsx from "clsx";

import { Icon } from "@/presentation/shared";
import { useSelectImage } from "@/presentation/shared/hooks/useSelectImage";
import { ICONS } from "@/shared/config/icons";

import styles from "./UserAvatar.module.css";

interface UserAvatarProps {
  avatarUrl?: string;
  onImageSelected: (file: File) => void;
  className?: string;
  /** Class of the camera badge: e.g. to hide it on a desktop */
  badgeClassName?: string;
}

export function UserAvatar({
  avatarUrl,
  onImageSelected,
  className,
  badgeClassName,
}: UserAvatarProps) {
  const { inputRef, openFileDialog, handleChange } = useSelectImage({
    onSelect: onImageSelected,
  });

  return (
    <button type="button" className={clsx(styles.container, className)} onClick={openFileDialog}>
      <AvatarImage avatarUrl={avatarUrl} />
      <Icon
        as={ICONS.camera}
        size="24px"
        className={clsx(styles.badgeIcon, badgeClassName)}
        color="var(--icon-secondary)"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </button>
  );
}

function AvatarImage({ avatarUrl }: { avatarUrl?: string }) {
  return avatarUrl ? (
    <img className={styles.userAvatar} src={avatarUrl} alt="Аватарка" />
  ) : (
    <Icon as={ICONS.profileLarge} size="40px" />
  );
}
