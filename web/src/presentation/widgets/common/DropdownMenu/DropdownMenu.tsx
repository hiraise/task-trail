"use client";

import { useState, useRef } from "react";

import styles from "./DropdownMenu.module.css";
import { Icon } from "@/presentation/ui/Icon";
import { MenuItem } from "./DropdownMenu.types";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
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

  if (items.length === 0) return null;

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
                style={{ color: item.color ? item.color : undefined }}
                onClick={(e) => {
                  item.onClick();
                  handleClose(e);
                }}
              >
                {item.icon && <Icon as={item.icon} size="24px" inheritColor />}
                <span className="btn-font-s" style={{ color: "inherit" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
