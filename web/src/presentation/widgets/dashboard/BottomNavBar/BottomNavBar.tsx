"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion as m } from "framer-motion";
import clsx from "clsx";

import styles from "./BottomNavBar.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { NavItem, navItems } from "./BottomNavBar.config";
import { normalize } from "@/shared/utils/formatters";
import { ICONS } from "@/infrastructure/config/icons";
import { ROUTES } from "@/infrastructure/config/routes";

export function BottomNavBar() {
  const pathName = usePathname();

  return (
    <div className={styles.container}>
      <Link className={styles.search} href={ROUTES.dashboard}>
        <Icon as={ICONS.search} size="24px" inheritColor />
      </Link>
      <div className={styles.menu}>
        {navItems.map((item) => {
          const isCurrent = normalize(pathName) === normalize(item.href);
          return <MenuItem key={item.label} {...item} isCurrent={isCurrent} />;
        })}
      </div>
    </div>
  );
}

const MotionLink = m.create(Link);

interface MenuItemsProps extends NavItem {
  isCurrent: boolean;
}

function MenuItem({ isCurrent, ...props }: MenuItemsProps) {
  const { href, icon, label } = props;
  const iconColor = isCurrent ? "var(--icon-primary)" : "var(--icon-secondary)";

  return (
    <MotionLink
      href={href}
      className={clsx(styles.icon, { [styles.active]: isCurrent })}
      animate={{ width: isCurrent ? "auto" : 48 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <Icon as={icon} size="24px" color={iconColor} />
      <AnimatePresence mode="wait">
        {isCurrent && (
          <m.span
            key="label"
            className="caption-med"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {label}
          </m.span>
        )}
      </AnimatePresence>
    </MotionLink>
  );
}
