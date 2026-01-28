"use client";

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  type Placement,
} from "@floating-ui/react";
import { useState } from "react";

import { Icon } from "../Icon";

import styles from "./DropdownMenu.module.css";
import type { MenuItem } from "./DropdownMenu.types";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  placement?: Placement;
}

export function DropdownMenu({ trigger, items, placement = "bottom-end" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    placement,
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ["top-end", "bottom-start", "top-start"],
      }),
      shift({ padding: 8 }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  if (items.length === 0) return null;

  return (
    <div className={styles.dropdownMenuContainer}>
      <div ref={refs.setReference} {...getReferenceProps()} className={styles.dropdownTrigger}>
        {trigger}
      </div>

      {isOpen && (
        <>
          <div className={styles.dropdownOverlay} onClick={() => setIsOpen(false)} />
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={styles.dropdownMenu}
            role="menu"
          >
            {items.map((item, index) => (
              <button
                key={index}
                className={styles.dropdownItem}
                style={{ color: item.color ? item.color : undefined }}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setIsOpen(false);
                }}
                role="menuitem"
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
