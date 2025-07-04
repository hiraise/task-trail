"use client";

import { useEffect, useRef } from "react";
import { motion as m } from "framer-motion";

import styles from "./BottomSheet.module.css";
import { useScrollLock } from "@/shared/hooks/useScrollLock";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <m.div className={styles.bottomSheet} role="dialog" aria-modal="true">
      <m.div
        className={styles.overlay}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      />
      <div className={styles.wrapper}>
        <m.div
          ref={contentRef}
          className={styles.content}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, { offset, velocity }) => {
            if (offset.y > 150 || velocity.y > 500) onClose();
          }}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.handle} />
          {children}
        </m.div>
      </div>
    </m.div>
  );
}
