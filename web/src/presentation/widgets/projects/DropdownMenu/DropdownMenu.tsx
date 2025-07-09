"use client";

import { useState, useRef, ReactNode } from "react";

import styles from "./DropdownMenu.module.css";

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    handleClose();
  };

  return (
    <div className={styles.dropdownMenuContainer} ref={menuRef}>
      <div onClick={handleToggle}>{trigger}</div>
      {isOpen && (
        <>
          <div className={styles.dropdownOverlay} onClick={handleClose} />
          <div className={styles.dropdownMenu}>
            {items.map((item, index) => (
              <button
                key={index}
                className={styles.dropdownItem}
                onClick={() => handleItemClick(item.onClick)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
