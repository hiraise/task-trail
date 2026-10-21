import { useNavigate } from "@tanstack/react-router";
import { ICONS } from "@/shared/config/icons";
import { IconButton } from "@/presentation/shared/ui";

import styles from "./TobBarBackMobile.module.css";

export type Variant = "menu" | "sort" | "none" | "addUser";

interface TopBarBackMobileProps {
  title: string;
  variant?: Variant;
  onActionClick?: () => void;
}

export function TopBarBackMobile({
  title,
  variant = "none",
  onActionClick,
}: TopBarBackMobileProps) {
  const navigate = useNavigate();

  let content: React.ReactNode;

  switch (variant) {
    case "menu":
      content = <IconButton icon={ICONS.menuHorizontal} size="24px" onClick={onActionClick} />;
      break;
    case "sort":
      content = <IconButton icon={ICONS.sort} size="24px" onClick={onActionClick} />;
      break;
    case "addUser":
      content = <IconButton icon={ICONS.addUser} size="24px" onClick={onActionClick} />;
      break;
    case "none":
    default:
      content = null;
  }

  return (
    <div className={styles.container}>
      <IconButton
        icon={ICONS.leftArrowWithPadding}
        size="24px"
        onClick={() => navigate({ to: ".." })}
      />
      <h4 className={styles.title}>{title}</h4>
      {content}
    </div>
  );
}
