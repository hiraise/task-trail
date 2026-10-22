import { Icon } from "@/presentation/shared";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";

import styles from "./ActionsMenu.module.css";

interface ActionsMenuProps {
  items: MenuItem[];
  /** Закрыть окно меню: вызывается до действия пункта */
  onClose: () => void;
}

/**
 * Меню действий в нижней панели телефона. Окна открываются стеком: меню закрывается до действия,
 * иначе после окна действия (подтверждения, формы) оно вернётся на экран.
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
