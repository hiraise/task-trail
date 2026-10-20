import { ICONS } from "@/shared/config/icons";

import { BackButton } from "../BackButton";
import { IconButton } from "../IconButton";

import styles from "./Dialog.module.css";

interface DialogTitleProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onClose: () => void;
}

export function DialogTitle({ title, showBackButton = false, onBack, onClose }: DialogTitleProps) {
  return (
    <div className={styles.title}>
      {onBack && showBackButton && (
        <div className={styles.backButton}>
          <BackButton onClick={onBack} showLabel={false} />
        </div>
      )}
      <h4>{title}</h4>
      <div className={styles.closeButton}>
        <IconButton icon={ICONS.close} onClick={onClose} />
      </div>
    </div>
  );
}
