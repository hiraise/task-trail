import clsx from "clsx";
import { motion as m } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";

import styles from "./DraggableContent.module.css";

interface DraggableContentProps {
  children: React.ReactNode;
  fullScreen?: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

export function DraggableContent({
  children,
  fullScreen,
  contentRef,
  isDragging,
}: DraggableContentProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: "bottom-sheet" });

  const dragTransform = transform ? transform.y : 0;
  const finalTransform = Math.max(0, dragTransform);

  const containerStyles = {
    "--drag-transform": `${finalTransform}px`,
    "--cursor-type": isDragging ? "grabbing" : "grab",
  } as React.CSSProperties;

  return (
    <m.div
      ref={(node) => {
        setNodeRef(node);
        contentRef.current = node;
      }}
      className={clsx(styles.content, { [styles.fullScreen]: fullScreen })}
      style={containerStyles}
      initial={{ y: "100%" }}
      animate={{ y: isDragging ? finalTransform : 0 }}
      exit={{ y: "100%" }}
      transition={{
        type: isDragging ? "tween" : "spring",
        stiffness: 400,
        damping: 40,
        mass: 1,
        duration: isDragging ? 0 : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
      {...attributes}
      {...listeners}
      tabIndex={-1}
    >
      {/* Drag handle */}
      <div className={styles.handle} />

      {/* Content */}
      <div className={clsx(styles.body, { [styles.fullScreen]: fullScreen })}>{children}</div>
    </m.div>
  );
}
