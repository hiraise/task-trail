import clsx from "clsx";
import { motion as m } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";

import { Icon } from "@/presentation/shared/ui";

import { UnreadBadge } from "../../UnreadBadge";
import { normalize } from "@/shared/utils/formatters";

import type { NavMenuItem } from "./Drawer.config";
import styles from "./NavItem.module.css";

interface NavItemProps {
  item: NavMenuItem;
  isExpanded?: boolean;
}

export function NavItem({ item, isExpanded }: NavItemProps) {
  const pathName = useRouterState({ select: (s) => s.location.pathname });
  const isActive = normalize(pathName).startsWith(normalize(item.href));

  return (
    <Link to={item.href} className={clsx(styles.navItem, { [styles.active]: isActive })}>
      <span className={styles.icon}>
        <Icon as={item.icon} size="24px" />
        {!isExpanded && <UnreadBadge count={item.badge ?? 0} className={styles.cornerBadge} />}
      </span>
      <m.span
        className={clsx("body-med-2", styles.label)}
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {item.label}
      </m.span>
      {isExpanded && <UnreadBadge count={item.badge ?? 0} />}
    </Link>
  );
}
