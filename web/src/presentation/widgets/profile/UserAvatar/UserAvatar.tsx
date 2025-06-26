import Image from "next/image";

import styles from "./UserAvatar.module.css";
import AvatarIcon from "../../../../../public/icons/profile-large.svg?url";
import { useSelectImage } from "@/shared/hooks/useSelectImage";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

type UserAvatarProps = {
  avatarUrl?: string;
  onImageSelected: (file: File) => void;
};

function AvatarImage({ avatarUrl }: { avatarUrl?: string }) {
  return avatarUrl ? (
    <Image
      className={styles["user-avatar"]}
      src={avatarUrl}
      alt="User Avatar"
      fill
      onError={() => AvatarIcon}
    />
  ) : (
    <Icon as={ICONS.profileLarge} size="40px" />
  );
}

export function UserAvatar({ avatarUrl, onImageSelected }: UserAvatarProps) {
  const { inputRef, openFileDialog, handleChange } = useSelectImage({
    onSelect: onImageSelected,
  });

  return (
    <>
      <div className={styles["icon-wrapper"]} onClick={openFileDialog}>
        <AvatarImage avatarUrl={avatarUrl} />
        <Icon
          as={ICONS.camera}
          size="29px"
          className={styles["badge-icon"]}
          color="var(--background)"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </>
  );
}
