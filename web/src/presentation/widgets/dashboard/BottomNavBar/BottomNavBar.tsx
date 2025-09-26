"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion as m, Transition } from "framer-motion";
import { useRef, useEffect, useState } from "react";

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
      href={href}
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
