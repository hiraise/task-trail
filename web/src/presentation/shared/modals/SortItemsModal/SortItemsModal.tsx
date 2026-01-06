"use client";

import { useState } from "react";

import { TEXTS } from "@/shared/locales/texts";

import { DeviceBased, DialogButtons } from "../../components";
import { BaseModal, type BaseModalProps } from "../BaseModal";

import type { SortOption } from "./SortItems";
import { SortItems, SortItemsDesktop } from "./SortItems";
import { options } from "./SortItems/SortItems.types";

export default function SortItemsModal(props: BaseModalProps<string>) {
  const [selectedOption, setSelectedOption] = useState<SortOption>(options[0]);

  const handleMobileSort = (option: SortOption) => {
    setSelectedOption(option);
    props.onClose(option.value);
  };

  const handleDesktopSort = (option: SortOption) => {
    setSelectedOption(option);
  };

  const handleApply = () => {
    props.onClose(selectedOption.value);
  };

  return (
    <BaseModal {...props} title={TEXTS.sort}>
      <DeviceBased
        desktop={
          <>
            <SortItemsDesktop selectedOption={selectedOption} onSelect={handleDesktopSort} />
            <DialogButtons onClose={() => props.onClose()} onApply={handleApply} />
          </>
        }
        mobile={<SortItems selectedOption={selectedOption} onSelect={handleMobileSort} />}
      />
    </BaseModal>
  );
}
