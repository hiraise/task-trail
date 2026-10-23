import clsx from "clsx";
import { useState } from "react";

import { IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { searchTexts } from "@/shared/locales/search";

import styles from "./SearchGroup.module.css";

interface SearchGroupProps {
  title: string;
  children: React.ReactNode;
}

/** A group of results with a title; the arrow collapses it (frames 1897:183080, 1220:96797). */
export function SearchGroup({ title, children }: SearchGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className={styles.group}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <IconButton
          icon={ICONS.downArrow}
          className={clsx(styles.toggle, isExpanded && styles.expanded)}
          aria-label={isExpanded ? searchTexts.collapse : searchTexts.expand}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
        />
      </div>
      {isExpanded && children}
    </section>
  );
}
