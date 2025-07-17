"use client";

import React from "react";
import clsx from "clsx";
import styles from "./DropdownMenu.module.css";
import { useDropdownContext } from "./DropdownMenu";

export interface DropdownItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropdownItem({
  value,
  children,
  disabled = false,
}: DropdownItemProps) {
  const { selectedValue, onSelect } = useDropdownContext();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (onSelect) onSelect(value);
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="option"
      aria-selected={isSelected}
      className={clsx(styles.item, {
        [styles.selected]: isSelected,
        [styles.disabled]: disabled,
      })}
    >
      {children}
    </button>
  );
}

DropdownItem.displayName = "DropdownItem";
