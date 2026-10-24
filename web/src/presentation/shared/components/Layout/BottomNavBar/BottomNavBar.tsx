import type { Transition } from "framer-motion";
import clsx from "clsx";
import { AnimatePresence, motion as m } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { notificationsTexts } from "@/shared/locales/notifications";
import { TEXTS } from "@/shared/locales/texts";
import { interpolate } from "@/shared/utils/interpolate";
import { normalize } from "@/shared/utils/formatters";
import { useUnreadNotifications } from "@/presentation/shared/hooks";
import { Icon } from "@/presentation/shared/ui";

import { UnreadBadge } from "../../UnreadBadge";

import type { NavItem } from "./BottomNavBar.config";
import { navItems } from "./BottomNavBar.config";
import styles from "./BottomNavBar.module.css";

export function BottomNavBar() {
  const pathName = useRouterState({ select: (s) => s.location.pathname });
  const { data: unread } = useUnreadNotifications();
  const onNotifications = normalize(pathName) === normalize(ROUTES.notifications);

  return (
    <div className={styles.container}>
      <Link className={styles.search} to={ROUTES.search}>
        <Icon as={ICONS.search} size="24px" inheritColor />
      </Link>
      <Link
        className={clsx(styles.search, styles.bell, onNotifications && styles.bellCurrent)}
        to={ROUTES.notifications}
        aria-label={bellLabel(unread ?? 0)}
      >
        <Icon as={ICONS.bell} size="24px" inheritColor />
        <UnreadBadge count={unread ?? 0} className={styles.bellBadge} />
      </Link>
      <div className={styles.menu}>
        {navItems.map((item) => {
          const isCurrent = normalize(pathName) === normalize(item.href);

          return (
            <AnimatePresence key={item.label} mode="popLayout">
              <MenuItem {...item} isCurrent={isCurrent} />
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}

// The icon-only link carries the counter in its name: the title, a comma and the unread count
function bellLabel(unread: number): string {
  if (unread <= 0) return TEXTS.navBar.notifications;

  return `${TEXTS.navBar.notifications}, ${interpolate(notificationsTexts.unreadCount, { count: String(unread) })}`;
}

const MotionLink = m.create(Link);
const INACTIVE_ICON_WIDTH = 48;

interface MenuItemsProps extends NavItem {
  isCurrent: boolean;
}

function MenuItem({ isCurrent, ...props }: MenuItemsProps) {
  const { href, icon, label } = props;
  const iconColor = isCurrent ? "var(--icon-primary)" : "var(--icon-secondary)";
  const divColor = isCurrent ? "var(--bg-card)" : "rgba(255, 255, 255, 0)";
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(INACTIVE_ICON_WIDTH);

  const transition = { duration: 0.3, ease: "circInOut" } as Transition;

  useEffect(() => {
    // If this menu item is the current one and the ref is set
    if (isCurrent && containerRef.current) {
      // Temporarily set width to 'max-content' to measure the full width of the label and icon
      containerRef.current.style.width = "max-content";
      // Measure the width of the element
      const width = containerRef.current.getBoundingClientRect().width;

      // Store the measured width in state for animation
      setMeasuredWidth(width);
      // Reset the width style to allow framer-motion to animate it
      containerRef.current.style.width = "";
    }
  }, [isCurrent, label]);

  return (
    <MotionLink
      ref={containerRef}
      to={href}
      className={styles.icon}
      initial={{ opacity: 0, width: INACTIVE_ICON_WIDTH }}
      animate={{
        opacity: 1,
        width: isCurrent ? measuredWidth : INACTIVE_ICON_WIDTH,
        backgroundColor: divColor,
      }}
      exit={{ opacity: 0, width: INACTIVE_ICON_WIDTH }}
      transition={transition}
    >
      <m.div animate={{ opacity: 1 }} transition={transition}>
        <Icon as={icon} size="24px" color={iconColor} />
      </m.div>
      <m.span
        className="caption-med"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        {label}
      </m.span>
    </MotionLink>
  );
}
