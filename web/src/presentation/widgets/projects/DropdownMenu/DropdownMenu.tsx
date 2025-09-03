"use client";

import { useState, useRef } from "react";

import styles from "./DropdownMenu.module.css";

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
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
                onClick={(e) => {
                  item.onClick();
                  handleClose(e);
                }}
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
