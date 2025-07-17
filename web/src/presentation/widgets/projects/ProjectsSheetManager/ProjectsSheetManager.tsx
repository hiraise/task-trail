"use client";
import { JSX } from "react";

import CreateProjectModal from "../../modals/CreateProjectModal";
import InviteUserModal from "../../modals/InviteUserModal";
import { ProjectCreationProvider } from "../../../../application/projects/context/ProjectCreationContext";
import { MODAL_TYPES } from "@/infrastructure/config/modalTypes";
import SortProjectsModal from "@/presentation/widgets/modals/SortProjectsModal";
import { useSheetNavigation } from "@/shared/hooks/useSheetNavigation";
import CreateTaskModal from "../../modals/CreateTaskModal";

export function ProjectsSheetManager() {
  const { isEmpty, currentSheet, getCommonProps } = useSheetNavigation();

  if (isEmpty) return null;

  const props = getCommonProps();

  const renderWithProvider = (component: JSX.Element) => (
    <ProjectCreationProvider>{component}</ProjectCreationProvider>
  );

  switch (currentSheet.type) {
    case MODAL_TYPES.CREATE_PROJECT:
      return renderWithProvider(<CreateProjectModal {...props} />);

    case MODAL_TYPES.CREATE_TASK:
      return renderWithProvider(<CreateTaskModal {...props} />);

    case MODAL_TYPES.INVITE_USER:
      return renderWithProvider(<InviteUserModal {...props} />);

    case MODAL_TYPES.SORT_PROJECTS:
      return renderWithProvider(<SortProjectsModal {...props} />);

    case MODAL_TYPES.SORT_TASKS:
      return renderWithProvider(<SortProjectsModal {...props} />);

    default:
      return null;
  }
}
