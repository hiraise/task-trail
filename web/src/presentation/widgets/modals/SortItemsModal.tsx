import { SortOption, SortItems } from "../common/SortItems";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./BaseModal.types";

export default function SortItemsModal(props: BaseModalProps<string>) {
  const handleSort = (option: SortOption) => {
    console.log(`Sorting by: ${option.label}`);
    props.onClose(option.value);
  };
  return (
    <BaseModal {...props} title="Сортировка">
      <SortItems onSelect={handleSort} />
    </BaseModal>
  );
}
