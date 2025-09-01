import { useCallback } from "react";

import { useCreateProjectFormStore, ProjectFormData } from "@/shared/store/createProjectFormStore";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { ProjectPayload } from "@/domain/project/project.payload";
import { useCreateProject } from "./useProject";

export function useCreateProjectForm() {
  const state = useCreateProjectFormStore();
  const { mutateAsync: create } = useCreateProject();
  const { showInviteUser } = useGlobalModals();

  const setState = useCallback(
    (partialState: Partial<ProjectFormData>) => {
      state.set(partialState);
    },
    [state]
  );

  const submitForm = useCallback(
    async (data: ProjectPayload) => {
      console.log("Final project data with participants:", data);
      await create(data);
      state.reset();
    },
    [create, state]
  );

  const toggleParticipant = useCallback(
    (email: string) => {
      state.toggleParticipant(email);
    },
    [state]
  );

  const addParticipant = useCallback(
    (email: string) => {
      state.addParticipant(email);
    },
    [state]
  );

  const handleInviteUser = async () => {
    const emails = await showInviteUser();
    if (!emails || emails.length === 0) return;
    setState({ participants: emails });
  };

  return {
    state,
    setState,
    toggleParticipant,
    addParticipant,
    submitForm,
    handleInviteUser,
  };
}
