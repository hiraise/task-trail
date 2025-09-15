import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion as m } from "framer-motion";

import styles from "./NavItem.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { NavMenuItem } from "./Drawer.config";
import { normalize } from "@/shared/utils/formatters";

interface NavItemProps {
  item: NavMenuItem;
  isExpanded?: boolean;
}

export function NavItem({ item, isExpanded }: NavItemProps) {
  const pathName = usePathname();
  const isActive = normalize(pathName) === normalize(item.href);

  return (
    <Link href={item.href} className={clsx(styles.navItem, { [styles.active]: isActive })}>
      <Icon as={item.icon} size="24px" />
      <m.span
        className="body-med-2"
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {item.label}
      </m.span>
    </Link>
  );
}
