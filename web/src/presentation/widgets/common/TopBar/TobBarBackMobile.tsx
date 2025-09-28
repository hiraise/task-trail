"use client";

import { useRouter } from "next/navigation";

import styles from "./TobBarBackMobile.module.css";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";

export function TopBarBackMobile({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <IconButton icon={ICONS.leftArrowWithPadding} size="24px" onClick={() => router.back()} />
      <h4 className={styles.title}>{title}</h4>
    </div>
  );
}
