"use client";

import { useState } from "react";

import styles from "./ChangeTaskStatusModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";
import { TASK_STATUS, TaskStatus } from "@/domain/task/task.entity";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface ChangeTaskStatusProps {
  status: TaskStatus;
  onChange: (newStatus: TaskStatus) => void;
}

export function ChangeTaskStatus({ status, onChange }: ChangeTaskStatusProps) {
  const [selectedStatus, setSelectedStatus] = useState(status);

  const handleStatusChange = (newStatus: TaskStatus) => {
    setSelectedStatus(newStatus);
    onChange(newStatus);
  };

  return (
    <div className={styles.statusContainer}>
      {TASK_STATUS.map((status) => (
        <div
          key={status}
          className={styles.statusWrapper}
          onClick={() => handleStatusChange(status)}
        >
          {status}
          {selectedStatus === status && <Icon as={ICONS.checkMark} size="14px" inheritColor />}
        </div>
      ))}
    </div>
  );
}

interface ChangeTaskStatusModalProps extends BaseModalProps<TaskStatus> {
  currentStatus: TaskStatus;
}

export default function ChangeTaskStatusModal({
  currentStatus,
  ...props
}: ChangeTaskStatusModalProps) {
  const handleSelectStatus = (newStatus: TaskStatus) => {
    if (currentStatus === newStatus) return;
    props.onClose(newStatus);
  };

  return (
    <BaseModal title="Статус задачи" {...props}>
      <ChangeTaskStatus status={currentStatus} onChange={handleSelectStatus} />
    </BaseModal>
  );
}
