"use client";

import { useState } from "react";

import type { TaskStatusResponseDto } from "@/application/dto/TaskStatusResponseDto";
import { DeviceBased, DialogButtons } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks/useGlobalModalProps";
import type { ChangeStatusProps } from "@/presentation/shared/hooks/useGlobalModals";
import type { BaseModalProps } from "@/presentation/shared/modals";
import { BaseModal } from "@/presentation/shared/modals";
import { TEXTS } from "@/shared/locales/texts";

import { TaskStatusDesktop, TaskStatusMobile } from "../../components";

export default function ChangeTaskStatusModal(props: BaseModalProps<TaskStatusResponseDto>) {
  const { onClose, ...rest } = props;

  const { currentStatus } = useGlobalModalProps<ChangeStatusProps>() ?? {};
  const [status, setStatus] = useState(currentStatus);

  const handleApply = () => onClose(status);
  const handleClose = () => onClose(undefined);

  const handleSelect = (value: TaskStatusResponseDto, isDesktop?: boolean) => {
    setStatus(value);
    // Close modal immediately only on mobile devices
    if (!isDesktop) onClose(value);
  };

  return (
    <BaseModal title={TEXTS.tasks.status} onClose={handleClose} {...rest}>
      <DeviceBased
        desktop={
          <>
            <TaskStatusDesktop
              selectedStatus={status}
              onSelect={(value) => handleSelect(value, true)}
            />
            <DialogButtons onClose={handleClose} onApply={handleApply} />
          </>
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
