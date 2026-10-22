import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectCreated } from "@/domain/repositories/ProjectRepository";
import { projectRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";

/**
 * Создаёт проект и зовёт в него почты из `emails` тем же запросом (ADR-0016). Результат
 * приглашений показывает форма — после того как закроет своё окно (useInvitationReport).
 */
export function useCreateProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<ProjectCreated, Error, CreateProjectPayload>({
    mutationFn: ({ name, description, emails }) =>
      projectRepository.create({ name, description, emails }),
    onSuccess: ({ project }) => {
      queryClient.setQueryData(QUERY_KEYS.project.detail(project.id), project);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project.all });
      toast.success(projectsTexts.projectCreated);
      navigate({ to: "/projects/$id", params: { id: project.id } });
    },
    onError: (error) => toastError(error, projectsTexts.createProjectFailed),
  });
}
