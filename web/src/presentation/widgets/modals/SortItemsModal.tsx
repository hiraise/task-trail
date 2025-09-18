import { useState } from "react";

import styles from "./DesktopModal.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { options } from "../common/SortItems/SortItems.types";
import { SortOption, SortItems, SortItemsDesktop } from "../common/SortItems";
import { DialogButtons } from "../common/DialogButtons";

export default function SortItemsModal(props: BaseModalProps<string>) {
  const [selectedOption, setSelectedOption] = useState<SortOption>(options[0]);

  const handleMobileSort = (option: SortOption) => {
    setSelectedOption(option);
    console.log(`Sorting by: ${option.label}`);
    props.onClose(option.value);
  };

  const handleDesktopSort = (option: SortOption) => {
    setSelectedOption(option);
  };

  const handleApply = () => {
    console.log(`Sorting by: ${selectedOption.label}`);
    props.onClose(selectedOption.value);
  };

  return (
    <BaseModal {...props} title={TEXTS.sort}>
      <DeviceBased
        desktop={
          <div className={styles.desktop}>
            <SortItemsDesktop selectedOption={selectedOption} onSelect={handleDesktopSort} />
            <DialogButtons onClose={() => props.onClose()} onApply={handleApply} />
          </div>
        }
        mobile={<SortItems selectedOption={selectedOption} onSelect={handleMobileSort} />}
      />
    </BaseModal>
  );
}
