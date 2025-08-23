import { useParams } from "next/navigation";

import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectProjectData } from "../slices/projectSelectors";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { projectService } from "@/infrastructure/api/projectService";

export const useProject = () => {
  const params = useParams();
  const projectId = Number(params.id);

  const { project, owner, isLoading, members } = useAppSelector(selectProjectData);

  return { isLoading, project, projectId, owner, members };
};

export const useGetTasks = () => {
  const params = useParams();
  const projectId = Number(params.id);

  return useQuery({
    queryKey: QUERY_KEYS.projectTasks(projectId),
    queryFn: () => projectService.getTasks(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
};
