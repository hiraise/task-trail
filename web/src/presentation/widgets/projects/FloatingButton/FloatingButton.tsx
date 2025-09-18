import { clsx } from "clsx";
import styles from "./FloatingButton.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";

type FloatingButtonVariant = "default" | "withBottomNav";

interface FloatingButtonProps {
  onClick: () => void;
  variant?: FloatingButtonVariant;
}

export function FloatingButton({ onClick, variant = "default" }: FloatingButtonProps) {
  return (
    <div className={clsx(styles.floatingButton, styles[variant])}>
      <IconButton icon={ICONS.addButton} onClick={onClick} size="58px" />
    </div>
  );
}
