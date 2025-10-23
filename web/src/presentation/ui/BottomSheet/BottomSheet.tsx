"use client";

import { useRef, useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

import styles from "./BottomSheet.module.css";

import { DraggableContent } from "./DraggableContent";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean; // Optional prop to make it full screen
}

export function BottomSheet(props: BottomSheetProps) {
  const { isOpen, onClose, children, fullScreen } = props;

  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 },
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });

  const sensors = useSensors(touchSensor, pointerSensor);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (event: { delta: { x: number; y: number } }) => {
    setIsDragging(false);

    const { delta } = event;
    if (!delta) return;

    const CLOSE_THRESHOLD = 150;
    const VELOCITY_THRESHOLD = 500;

    const dragDistance = delta.y;
    const velocity = Math.abs(dragDistance);

    if (dragDistance > CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD) onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.bottomSheet} role="dialog" aria-modal="true">
            <m.div
              className={styles.overlay}
              onClick={handleOverlayClick}
              initial={{ opacity: 0 }}
              animate={{ opacity: isDragging ? 0.2 : 0.32 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <DraggableContent
              fullScreen={fullScreen}
              contentRef={contentRef}
              isDragging={isDragging}
            >
              {children}
            </DraggableContent>
          </div>
        </DndContext>
      )}
    </AnimatePresence>
  );
}
