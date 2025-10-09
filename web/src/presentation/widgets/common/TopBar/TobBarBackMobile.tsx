"use client";

import { useRouter } from "next/navigation";

import styles from "./TobBarBackMobile.module.css";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";

interface TopBarBackMobileProps {
  title: string;
  onMenuClick?: () => void;
  onSortClick?: () => void;
}

export function TopBarBackMobile({ title, onMenuClick, onSortClick }: TopBarBackMobileProps) {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <IconButton icon={ICONS.leftArrowWithPadding} size="24px" onClick={() => router.back()} />
      <h4 className={styles.title}>{title}</h4>
      {onMenuClick && <IconButton icon={ICONS.menuHorizontal} size="24px" onClick={onMenuClick} />}
      {onSortClick && <IconButton icon={ICONS.sort} size="24px" onClick={onSortClick} />}
    </div>
  );
}
