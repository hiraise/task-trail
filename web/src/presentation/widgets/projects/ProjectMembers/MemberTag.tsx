import styles from "./MemberTag.module.css";

import { TEXTS } from "@/shared/locales/texts";

interface MemberTagProps {
  tag: "admin" | "member";
}
export function MemberTag({ tag }: MemberTagProps) {
  let tagText: string;
  let color: string;

  switch (tag) {
    case "admin":
      tagText = TEXTS.projects.admins;
      color = "var(--bg-accent-yellow)";
      break;
    case "member":
      tagText = TEXTS.projects.members;
      color = "var(--bg-accent-blue)";
      break;
  }
  return (
    <div className={styles.container} style={{ backgroundColor: color }}>
      <span className="caption-med">{tagText}</span>
    </div>
  );
}
