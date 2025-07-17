import Link from "next/link";

import styles from "./ProjectMenuButton.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface ProjectMenuButtonProps {
  href: string;
  text: string;
}

export function ProjectMenuButton({ href, text }: ProjectMenuButtonProps) {
  return (
    <div className={styles.container}>
      <p className={styles.text}>{text}</p>
      <Link href={href}>
        <Icon as={ICONS.rightArrow} size="17px" />
      </Link>
    </div>
  );
}
