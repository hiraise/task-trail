import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormFieldError, Icon, SubmitButton } from "@/presentation/shared";
import { useProjects } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";

import { SelectedUsers } from "../../../projects/components";
import { SelectionField } from "../../../tasks/components/CreateTaskForm/FormSelectionOptions";
import { useCreateBoard } from "../../hooks";
import { useCreateBoardFormStore } from "../../store/createBoardFormStore";
import { BoardNameField, boardNameSchema } from "../BoardNameField";

import styles from "./CreateBoardForm.module.css";

interface CreateBoardFormProps {
  /** Close the form modal: the board is created */
  onSubmit: () => void;
}

/**
 * A new board (frames 919:65152, 1334:39210, 1775:154351, 1775:154839): name, projects — your active
 * ones, members — people from your projects. After creation the board opens.
 */
export function CreateBoardForm({ onSubmit }: CreateBoardFormProps) {
  const store = useCreateBoardFormStore();
  const { projectIds, members, setName, setProjectIds, setMembers } = store;
  const { showSelectBoardProjects, showSelectBoardMembers } = useGlobalModals();
  const { data: projects } = useProjects();
  const { mutateAsync: createBoard } = useCreateBoard();
  const [projectsError, setProjectsError] = useState<string>();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    resolver: zodResolver(boardNameSchema),
    mode: "onChange",
    defaultValues: { name: store.name },
  });

  // Fields live in the draft: the pickers close the form (createBoardFormStore.ts)
  const name = useWatch({ control, name: "name" }) ?? "";

  useEffect(() => setName(name), [name, setName]);

  // Only projects the user still has: one could be left or archived since the draft was made
  const selectedProjects = (projects ?? []).filter((project) => projectIds.includes(project.id));

  const handleSelectProjects = async () => {
    const selected = await showSelectBoardProjects({
      selectedIds: projectIds,
      applyText: boardsTexts.select,
    });

    if (selected) {
      setProjectIds(selected);
      setProjectsError(undefined);
    }
  };

  const handleSelectMembers = async () => {
    const selected = await showSelectBoardMembers({
      selectedIds: members.map((member) => member.id),
      applyText: boardsTexts.add,
    });

    if (selected) setMembers(selected);
  };

  const submitHandler = async (values: { name: string }) => {
    if (selectedProjects.length === 0) {
      setProjectsError(boardsTexts.projectsRequired);

      return;
    }

    try {
      await createBoard({
        name: values.name,
        projectIds: selectedProjects.map((project) => project.id),
        memberIds: members.map((member) => member.id),
      });
      store.reset();
      onSubmit();
    } catch {
      // useCreateBoard has shown the error
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.form}>
      <div className={styles.fields}>
        <BoardNameField
          id="boardName"
          {...register("name")}
          length={name.length}
          error={errors.name?.message}
          disabled={isSubmitting}
        />
        <SelectionField
          icon={ICONS.project}
          placeholder={boardsTexts.selectProjects}
          value={selectedProjects.map((project) => project.name).join(", ")}
          invalid={!!projectsError}
          onClick={handleSelectProjects}
        />
        {projectsError && <FormFieldError>{projectsError}</FormFieldError>}
        {members.length > 0 && (
          <SelectedUsers
            emails={members.map((member) => member.email)}
            onDeleteUser={store.removeMemberByEmail}
            isExpanded
          />
        )}
        {/* type="button": the button is inside the form and must not submit it */}
        <SubmitButton type="button" variant="text" className={styles.invite} onClick={handleSelectMembers}>
          <Icon as={ICONS.plus} size="24px" />
          <span className="btn-font-s">{boardsTexts.inviteMember}</span>
        </SubmitButton>
      </div>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? boardsTexts.creating : boardsTexts.createButton}
      </SubmitButton>
    </form>
  );
}
