import { useParams } from "next/navigation";

import { useAppSelector } from "@/infrastructure/redux/hooks";
import { selectProjectData } from "../slices/projectSelectors";

export const useProject = () => {
  const params = useParams();
  const projectId = Number(params.id);

  const { project, owner, isLoading, members } = useAppSelector(selectProjectData);

  return { isLoading, project, projectId, owner, members };
};
