import Link from "next/link";

import { Icon } from "@/presentation/shared";

import styles from "./MenuButton.module.css";

interface MenuButtonProps {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
}

export function MenuButton({ href, icon, text }: MenuButtonProps) {
  return (
    <Link className={styles.buttonWrapper} href={href}>
      <span className="btn-font-m">{text}</span>
      <div className={styles.iconWrapper}>
        <Icon as={icon} size="24px" />
      </div>
    </Link>
  );
}
