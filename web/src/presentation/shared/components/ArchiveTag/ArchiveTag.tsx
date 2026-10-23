import clsx from "clsx";

import { TEXTS } from "@/shared/locales/texts";

import styles from "./ArchiveTag.module.css";

/** The "Archive" tag — an archived task or project; it is read-only (ADR-0027). */
export function ArchiveTag({ className }: { className?: string }) {
  return <span className={clsx("caption-med", styles.tag, className)}>{TEXTS.archiveTag}</span>;
}
