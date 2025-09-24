import Image from "next/image";
import clsx from "clsx";

import styles from "./UserAvatar.module.css";
import { useSelectImage } from "@/shared/hooks/useSelectImage";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface UserAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  avatarUrl?: string;
  onImageSelected: (file: File) => void;
  showIcon?: boolean;
}

export function UserAvatar({
  avatarUrl,
  onImageSelected,
  showIcon = true,
  ...props
}: UserAvatarProps) {
  const { inputRef, openFileDialog, handleChange } = useSelectImage({
    onSelect: onImageSelected,
  });

  return (
    <button className={clsx(styles.container, props.className)} onClick={openFileDialog}>
      <AvatarImage avatarUrl={avatarUrl} />
      {showIcon && (
        <Icon
          as={ICONS.camera}
          size="29px"
          className={styles.badgeIcon}
          color="var(--background)"
        />
      )}
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
    <Image
      className={styles.userAvatar}
      src={avatarUrl}
      alt="User Avatar"
      fill
      sizes="160px"
      priority
      onError={() => ICONS.profileLarge}
    />
  ) : (
    <Icon as={ICONS.profileLarge} size="40px" />
  );
}
