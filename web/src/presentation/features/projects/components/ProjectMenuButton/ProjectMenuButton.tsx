import Link from "next/link";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./ProjectMenuButton.module.css";

interface ProjectMenuButtonProps {
  href: string;
  text: string;
  showButton?: boolean;
}

export function ProjectMenuButton({ href, text, showButton = true }: ProjectMenuButtonProps) {
  return (
    <div className={styles.container}>
      <h4>{text}</h4>
      {showButton && (
        <Link href={href}>
          <Icon as={ICONS.rightArrowWithPadding} size="24px" color="var(--icon-secondary)" />
        </Link>
      )}
    </div>
  );
}
