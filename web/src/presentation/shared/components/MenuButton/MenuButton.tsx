import { Link } from "@tanstack/react-router";
import { Icon } from "@/presentation/shared";

import styles from "./MenuButton.module.css";
import type { ComponentType } from "react";

interface MenuButtonProps {
  href: string;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
}

export function MenuButton({ href, icon, text }: MenuButtonProps) {
  return (
    <Link className={styles.buttonWrapper} to={href}>
      <span className="btn-font-m">{text}</span>
      <div className={styles.iconWrapper}>
        <Icon as={icon} size="24px" />
      </div>
    </Link>
  );
}
