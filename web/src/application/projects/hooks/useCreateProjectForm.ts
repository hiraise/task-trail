import { useCallback } from "react";

import { useStore } from "@/shared/hooks/useStore";
import {
  createProjectFormStore,
  type ProjectFormData,
} from "@/shared/store/createProjectFormStore";
import { ProjectPayload } from "@/domain/project/project.payload";
import { useProjects } from "./useProjects";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

const selector = (state: ProjectFormData) => state;

export function useCreateProjectForm() {
  const state = useStore(createProjectFormStore, selector);
  const { create } = useProjects();
  const { showInviteUser } = useGlobalModals();

  const setState = useCallback((partialState: Partial<ProjectFormData>) => {
    createProjectFormStore.set(partialState);
  }, []);

  const submitForm = useCallback(
    async (data: ProjectPayload) => {
      console.log("Final project data with participants:", data);
      await create(data);
      createProjectFormStore.reset();
    },
    [create]
  );

  const toggleParticipant = useCallback((email: string) => {
    createProjectFormStore.toggleParticipant(email);
  }, []);

  const addParticipant = useCallback((email: string) => {
    createProjectFormStore.addParticipant(email);
  }, []);

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
