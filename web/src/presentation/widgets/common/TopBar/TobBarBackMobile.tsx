"use client";

import { useRouter } from "next/navigation";

import styles from "./TobBarBackMobile.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";

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
  const router = useRouter();

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
      <IconButton icon={ICONS.leftArrowWithPadding} size="24px" onClick={() => router.back()} />
      <h4 className={styles.title}>{title}</h4>
      {content}
    </div>
  );
}
