"use client";

import styles from "./KanbanTask.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface CreateTaskProps {
  variant: "default" | "short";
}

export function CreateTask({ variant }: CreateTaskProps) {
  const handleClick = () => {
    console.log("Create new task");
  };

  switch (variant) {
    case "default":
      return (
        <div className={styles.createTaskContainer} onClick={handleClick}>
          <Icon as={ICONS.plus} size="16px" />
          <span>Создать задачу</span>
        </div>
      );

    case "short":
      return (
        <div className={styles.createTaskContainer} onClick={handleClick}>
          <Icon as={ICONS.plus} size="16px" />
        </div>
      );
  }
}
