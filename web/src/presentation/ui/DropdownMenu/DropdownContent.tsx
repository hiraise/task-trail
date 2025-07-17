"use client";

import React from "react";
import clsx from "clsx";

import { useDropdownContext } from "./DropdownMenu";
import styles from "./DropdownMenu.module.css";

interface DropdownContentProps {
  children: React.ReactNode;
  placeholder?: string;
}

export function DropdownContent({
  children,
  placeholder,
}: DropdownContentProps) {
  const { isOpen, openUpward } = useDropdownContext();

  if (!isOpen) return null;

  return (
    <div
      id="dropdown-menu"
      className={clsx(styles.menu, {
        [styles.upward]: openUpward,
        [styles.downward]: !openUpward,
      })}
      role="listbox"
      aria-label={placeholder || "Options"}
    >
      {children}
    </div>
  );
}

DropdownContent.displayName = "DropdownContent";
