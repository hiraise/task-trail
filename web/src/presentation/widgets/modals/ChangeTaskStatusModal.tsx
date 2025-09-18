"use client";

import { useState } from "react";

import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { TaskStatus } from "@/domain/task/task.entity";
import { TEXTS } from "@/shared/locales/texts";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { TaskStatusDesktop, TaskStatusMobile } from "../tasks/ChangeTaskStatus";
import { useGlobalModalProps } from "@/shared/hooks/useGlobalModalProps";
import { ChangeStatusProps } from "@/shared/hooks/useGlobalModals";

export default function ChangeTaskStatusModal(props: BaseModalProps<TaskStatus>) {
  const { onClose, ...rest } = props;

  const { currentStatus } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const [status, setStatus] = useState(currentStatus);

  const handleApply = () => onClose(status);
  const handleClose = () => onClose(undefined);

  const handleSelect = (value: TaskStatus, isDesktop?: boolean) => {
    setStatus(value);
    // Close modal immediately only on mobile devices
    if (!isDesktop) onClose(value);
  };

  return (
    <BaseModal title={TEXTS.tasks.status} onClose={handleClose} {...rest}>
      <DeviceBased
        desktop={
          <TaskStatusDesktop
            selectedStatus={status}
            onSelect={(value) => handleSelect(value, true)}
            onApply={handleApply}
            onClose={handleClose}
          />
        }
        mobile={
          <TaskStatusMobile
            selectedStatus={status}
            onSelect={(value) => handleSelect(value, false)}
          />
        }
      />
    </BaseModal>
  );
}
