import styles from "./TaskSettings.module.css";

import { MenuItem } from "../DropdownMenu";
import { Icon } from "@/presentation/ui/Icon";

export function TaskSettings({ item }: { item: MenuItem }) {
  return (
    <button
      className={styles.button}
      style={{ color: item.color ? item.color : undefined }}
      onClick={item.onClick}
    >
      {item.icon && <Icon as={item.icon} size="24px" inheritColor />}
      <span className="btn-font-s" style={{ color: "inherit" }}>
        {item.label}
      </span>
    </button>
  );
}
