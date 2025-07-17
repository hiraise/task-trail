"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";

import { useDropdownContext } from "./DropdownMenu";
import styles from "./DropdownMenu.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "../Icon";

interface DropdownTriggerProps {
  children: React.ReactNode;
  name?: string;
  id?: string;
}

export const DropdownTrigger = forwardRef<
  HTMLButtonElement,
  DropdownTriggerProps
>(({ children, name, id }, ref) => {
  const { isOpen, onToggle, disabled } = useDropdownContext();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      name={name}
      id={id}
      className={styles.trigger}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={`${id || "dropdown"}-menu`}
      role="combobox"
    >
      {children}
      <Icon
        className={clsx(styles.arrow, isOpen && styles.open)}
        as={ICONS.downArrow}
        size="15px"
      />
    </button>
  );
});

DropdownTrigger.displayName = "DropdownTrigger";
