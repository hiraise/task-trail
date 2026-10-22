import { Icon } from "../../ui";
import type { MenuItem } from "../../ui/DropdownMenu";

import styles from "./ActionsMenu.module.css";

interface ActionsMenuProps {
  items: MenuItem[];
  /** Close the menu modal: called before the item's action */
  onClose: () => void;
}

/**
 * Action menu in a phone bottom sheet. Modals open as a stack: the menu closes before the action,
 * otherwise it returns to the screen after the action's modal (confirmation, form).
 */
export function ActionsMenu({ items, onClose }: ActionsMenuProps) {
  return (
    <div className={styles.wrapper}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={styles.button}
          style={{ color: item.color }}
          onClick={() => {
            onClose();
            item.onClick();
          }}
        >
          {item.icon && <Icon as={item.icon} size="24px" inheritColor />}
          <span className="btn-font-s" style={{ color: "inherit" }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
