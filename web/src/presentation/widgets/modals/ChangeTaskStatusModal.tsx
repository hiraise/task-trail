"use client";

import { useState } from "react";

import styles from "./ChangeTaskStatusModal.module.css";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { TASK_STATUS, TaskStatus } from "@/domain/task/task.entity";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";

interface ChangeTaskStatusProps {
  onChange: (newStatus: TaskStatus) => void;
}

export function ChangeTaskStatus({ onChange }: ChangeTaskStatusProps) {
  const { status } = useGlobalModalProps<{ status: string }>() ?? {};
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

export default function ChangeTaskStatusModal(props: BaseModalProps<TaskStatus>) {
  const handleSelectStatus = (newStatus: TaskStatus) => {
    props.onClose(newStatus);
  };

  return (
    <BaseModal title="Статус задачи" {...props}>
      <ChangeTaskStatus onChange={handleSelectStatus} />
    </BaseModal>
  );
}
