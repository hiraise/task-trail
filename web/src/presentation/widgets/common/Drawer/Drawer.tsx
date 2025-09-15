"use client";

import { useState } from "react";
import { motion as m } from "framer-motion";
import clsx from "clsx";

import styles from "./Drawer.module.css";

import { navItems, searchItem } from "./Drawer.config";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { NavItem } from "./NavItem";
import { TEXTS } from "@/shared/locales/texts";

const DRAWER_EXPANDED_WIDTH = 258;
const DRAWER_COLLAPSED_WIDTH = 72;
const LOGO_EXPANDED_WIDTH = 210;
const LOGO_COLLAPSED_WIDTH = 24;

export function Drawer() {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleDrawer = () => setIsExpanded((prev) => !prev);

  return (
    <m.div
      className={styles.drawer}
      animate={{ width: isExpanded ? DRAWER_EXPANDED_WIDTH : DRAWER_COLLAPSED_WIDTH }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.menuWrapper}>
        <Logo isExpanded={isExpanded} />
        <NavItems isExpanded={isExpanded} />
      </div>
      {isExpanded && <ExpandedToogleButton onClick={toggleDrawer} />}
      {!isExpanded && <CollapsedToogleButton onClick={toggleDrawer} />}
    </m.div>
  );
}

function Logo({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div className={styles.logoWrapper}>
      <m.div
        className={styles.logo}
        initial={false}
        animate={{ width: isExpanded ? LOGO_EXPANDED_WIDTH : LOGO_COLLAPSED_WIDTH }}
        transition={{ duration: 0.3 }}
      >
        <Icon as={ICONS.logoMedium} />
      </m.div>
    </div>
  );
}

function NavItems({ isExpanded }: { isExpanded: boolean }) {
  return (
    <nav className={styles.body}>
      <div className={styles.menuItems}>
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} isExpanded={isExpanded} />
        ))}
      </div>
      <hr className={styles.divider} />
      <NavItem item={searchItem} isExpanded={isExpanded} />
    </nav>
  );
}

function ExpandedToogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={styles.buttons}
      onClick={onClick}
      aria-label={TEXTS.drawer.collapse}
      aria-expanded={true}
    >
      <Icon as={ICONS.leftArrowWithPadding} size="24px" />
      <span className="btn-font-s">{TEXTS.drawer.collapse}</span>
    </button>
  );
}

function CollapsedToogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={clsx(styles.buttons, styles.collapsed)}
      onClick={onClick}
      aria-label={TEXTS.drawer.expand}
      aria-expanded={false}
    >
      <Icon as={ICONS.rightArrow} size="24px" />
    </button>
  );
}
