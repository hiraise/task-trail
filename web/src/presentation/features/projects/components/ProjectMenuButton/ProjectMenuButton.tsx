import { Link, type LinkProps } from "@tanstack/react-router";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./ProjectMenuButton.module.css";

interface ProjectMenuButtonProps {
  to: LinkProps["to"];
  params?: LinkProps["params"];
  text: string;
  showButton?: boolean;
}

export function ProjectMenuButton({ to, params, text, showButton = true }: ProjectMenuButtonProps) {
  return (
    <div className={styles.container}>
      <h4>{text}</h4>
      {showButton && (
        <Link to={to} params={params}>
          <Icon as={ICONS.rightArrowWithPadding} size="24px" color="var(--icon-secondary)" />
        </Link>
      )}
    </div>
  );
}
