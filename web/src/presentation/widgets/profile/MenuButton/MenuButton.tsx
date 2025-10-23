import Link from "next/link";

import styles from "./MenuButton.module.css";

import { Icon } from "../../../ui/Icon";

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
