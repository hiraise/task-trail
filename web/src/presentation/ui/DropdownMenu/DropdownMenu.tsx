"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  createContext,
  useContext,
} from "react";

import styles from "./DropdownMenu.module.css";

const DROPDOWN_MENU_HEIGH = 220; // 200px menu + 20px buffer

interface DropdownProps {
  value?: string;
  onSelect?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// Context for sharing state between Dropdown components
interface DropdownContextValue {
  isOpen: boolean;
  openUpward: boolean;
  selectedValue?: string;
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  disabled?: boolean;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown");
  }
  return context;
};

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownProps>(
  ({ value, onSelect, onBlur, disabled, children }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const handleToggle = () => {
      if (!disabled) {
        // Check space before opening
        if (!isOpen && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          setOpenUpward(spaceBelow < DROPDOWN_MENU_HEIGH);
        }
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (selectedValue: string) => {
      onSelect?.(selectedValue);
      setIsOpen(false);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleBlur = (event: React.FocusEvent) => {
      // Check if the new focus target is within the dropdown
      if (
        containerRef.current &&
        !containerRef.current.contains(event.relatedTarget as Node)
      ) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    const contextValue = {
      isOpen,
      openUpward,
      selectedValue: value,
      onToggle: handleToggle,
      onSelect: handleSelect,
      onClose: handleClose,
      disabled,
    };

    return (
      <DropdownContext value={contextValue}>
        <div
          ref={containerRef}
          className={styles.container}
          onBlur={handleBlur}
        >
          {children}
        </div>
      </DropdownContext>
    );
  }
);

DropdownMenu.displayName = "Dropdown";
