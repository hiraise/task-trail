import { useMemo, useCallback } from "react";
import { useQueries, UseQueryResult } from "@tanstack/react-query";

import { useGetUserTasks } from "@/application/user/hooks/useGetUserTasks";
import { userService } from "@/infrastructure/api/userService";
import { projectService } from "@/infrastructure/api/projectService";
import { Project } from "@/domain/project/project.entity";
import { User } from "@/domain/user/user.entity";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { getDisplayName } from "@/shared/utils/getDisplayName";

type UserData = { id: number; username: string; avatarUrl?: string };
type ProjectData = { id: number; name: string };

const createCombineResults = <T extends { id: number }>(
  results: UseQueryResult<T | undefined>[]
) => {
  const data = new Map<number, T>();
  results.forEach((r) => {
    if (r.data) {
      data.set(r.data.id, { ...r.data });
    }
  });
  return {
    data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
};

export const useGetTaskListData = () => {
  const { data: tasks } = useGetUserTasks();

  const userIds = useMemo(() => {
    const validIds =
      tasks?.map((task) => task.assigneeId).filter((id): id is number => id !== undefined) ?? [];
    return [...new Set(validIds)];
  }, [tasks]);

  const projectIds = useMemo(() => {
    const validIds =
      tasks?.map((task) => task.projectId).filter((id): id is number => id !== undefined) ?? [];
    return [...new Set(validIds)];
  }, [tasks]);

  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: QUERY_KEYS.user(id),
      queryFn: () => userService.getById(id),
      enabled: !!tasks,
      select: (data: User | null) => {
        if (!data) return;
        return {
          id: data.id,
          username: getDisplayName(data),
          avatarUrl: data.avatarUrl,
        };
      },
    })),
    combine: createCombineResults<UserData>,
  });

  const projectQueries = useQueries({
    queries: projectIds.map((id) => ({
      queryKey: QUERY_KEYS.project(id),
      queryFn: () => projectService.getById(id),
      enabled: !!tasks,
      select: (data: Project | null) => {
        if (!data) return;
        return {
          id: data.id,
          name: data.name,
        };
      },
    })),
    combine: createCombineResults<ProjectData>,
  });

  const getUserById = useCallback(
    (userId?: number) => (userId ? userQueries.data.get(userId) : null),
    [userQueries.data]
  );
  const getProjectById = useCallback(
    (projectId: number) => projectQueries.data.get(projectId),
    [projectQueries.data]
  );

  return {
    tasks,
    getUserById,
    getProjectById,
    isLoading: userQueries.isLoading || projectQueries.isLoading,
    isError: userQueries.isError || projectQueries.isError,
  };
};
