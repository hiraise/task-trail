import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { BaseModalProps } from "@/presentation/shared";
import { BaseModal, SubmitButton } from "@/presentation/shared";
import { useGlobalModalProps } from "@/presentation/shared/hooks";
import type { RenameBoardProps } from "@/presentation/shared/hooks/useGlobalModals";
import { boardsTexts } from "@/shared/locales/boards";

import { BoardNameField, boardNameSchema } from "../components/BoardNameField";
import { useRenameBoard } from "../hooks";

import styles from "./BoardModals.module.css";

/** Rename a board: the field with a 0/200 counter (frames 843:91482, 1772:147292). */
export function RenameBoardModal(props: BaseModalProps<void>) {
  const modalProps = useGlobalModalProps<RenameBoardProps>();

  if (!modalProps) return null;

  return <RenameBoard {...props} {...modalProps} />;
}

function RenameBoard({ boardId, name, ...props }: BaseModalProps<void> & RenameBoardProps) {
  const { mutateAsync: rename } = useRenameBoard();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    resolver: zodResolver(boardNameSchema),
    mode: "onChange",
    defaultValues: { name },
  });
  const value = useWatch({ control, name: "name" }) ?? "";

  const submitHandler = async (values: { name: string }) => {
    try {
      if (values.name !== name) await rename({ boardId, name: values.name });
      props.onClose();
    } catch {
      // useRenameBoard has shown the error; the form stays open
    }
  };

  return (
    <BaseModal {...props} title={boardsTexts.rename}>
      <form className={styles.form} onSubmit={handleSubmit(submitHandler)}>
        <BoardNameField
          id="boardRename"
          {...register("name")}
          length={value.length}
          error={errors.name?.message}
          disabled={isSubmitting}
        />
        <SubmitButton type="submit" disabled={isSubmitting}>
          {boardsTexts.save}
        </SubmitButton>
      </form>
    </BaseModal>
  );
}
