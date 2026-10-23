import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectCreated } from "@/domain/repositories/ProjectRepository";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { projectsTexts } from "@/shared/locales/projects";

/**
 * Creates the project and invites the `emails` in the same request (ADR-0016). The form shows
 * the invitation result after closing its modal (useInvitationReport) and a taken key under its field.
 */
export function useCreateProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<ProjectCreated, Error, CreateProjectPayload>({
    mutationFn: ({ name, description, key, emails }) =>
      projectRepository.create({ name, description, key, emails }),
    onSuccess: ({ project }) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.lists });
      toast.success(projectsTexts.projectCreated);
      navigate({ to: "/projects/$id", params: { id: project.id } });
    },
    onError: (error) => {
      if (!hasErrorCode(error, "PROJECT_KEY_TAKEN")) toastError(error, projectsTexts.createProjectFailed);
    },
  });
}
