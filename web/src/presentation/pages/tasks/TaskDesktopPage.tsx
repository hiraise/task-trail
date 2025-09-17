"use client";

import clsx from "clsx";
import styles from "./TaskDesktopPage.module.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { tasksTexts } from "@/shared/locales/tasks";
import CommentInput from "@/presentation/widgets/tasks/Comments/CommentInput";
import CommentsList from "@/presentation/widgets/tasks/Comments/CommentsList";

export function TaskDesktopPage() {
  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.contentWrapper}>
        <div className={clsx(styles.content, styles.taskInfo)}>
          <TaskInfo />
        </div>
        <div className={clsx(styles.content, styles.comments)}>
          <TaskComments />
        </div>
      </div>
    </div>
  );
}

function TaskInfo() {
  return <div>Task Info</div>;
}

function TaskComments() {
  return (
    <>
      <span className={styles.title}>{tasksTexts.comments.title}</span>
      <CommentInput />
      <CommentsList />
    </>
  );
}
