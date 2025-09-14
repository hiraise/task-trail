"use client";

import { useEffect, useRef } from "react";
import { motion as m, useDragControls } from "framer-motion";
import clsx from "clsx";

import styles from "./BottomSheet.module.css";
import { useScrollLock } from "@/shared/hooks/useScrollLock";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean; // Optional prop to make it full screen
}

export function BottomSheet(props: BottomSheetProps) {
  const { isOpen, onClose, children, fullScreen } = props;

  const contentRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const startDrag = (event: React.PointerEvent) => {
    dragControls.start(event);
  };

  if (!isOpen) return null;

  return (
    <m.div className={styles.bottomSheet} role="dialog" aria-modal="true">
      <m.div className={styles.overlay} exit={{ opacity: 0 }} onClick={handleOverlayClick} />
      <div className={styles.wrapper}>
        <m.div
          ref={contentRef}
          className={clsx(styles.content, { [styles.fullScreen]: fullScreen })}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, { offset, velocity }) => {
            if (offset.y > 150 || velocity.y > 500) onClose();
          }}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={styles.handle}
            onPointerDown={startDrag}
            style={{ touchAction: "none" }}
          />
          {children}
        </m.div>
      </div>
    </m.div>
  );
}
