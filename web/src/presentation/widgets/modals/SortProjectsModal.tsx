import { SortOption, SortProjects } from "../projects/SortProjects/SortProjects";
import { BaseModal } from "./BaseModal";
import { BaseModalProps } from "./modal.types";

export default function SortProjectsModal(props: BaseModalProps) {
  const { isOpen, onClose } = props;

  const handleClose = () => {
    onClose();
  };

  const handleSort = (option: SortOption) => {
    console.log(`Sorting by: ${option.label}`);
  };
  return (
    <BaseModal isOpen={isOpen} onClose={handleClose}>
      <SortProjects onSelect={handleSort} />
    </BaseModal>
  );
}
