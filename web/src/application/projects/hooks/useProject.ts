import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { projectService } from "@/infrastructure/api/projectService";
import { EditProjectPayload, ProjectPayload } from "@/domain/project/project.payload";
import { Project } from "@/domain/project/project.entity";
import { ROUTES } from "@/infrastructure/config/routes";

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

export const useGetProjectStatuses = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.projectStatuses(id),
    queryFn: () => projectService.getStatuses(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetProjectMembers = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.projectMembers(id),
    queryFn: () => projectService.getMembers(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddMember = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: (emails) => projectService.addMembers(emails, projectId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectMembers(projectId) }),
    onError: () => toast.error("Failed to add members"),
  });
};

export const useKickMember = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (memberId) => projectService.kickMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectMembers(id) });
      toast.success("Member kicked successfully");
    },
    onError: () => toast.error("Failed to kick member. Please try again."),
  });
};

export const useGetCandidates = () => {
  const params = useParams();
  const projectId = params.id ? Number(params.id) : undefined;
  return useQuery({
    queryKey: QUERY_KEYS.projectCandidates(projectId),
    queryFn: () => projectService.getCandidates(projectId),
  });
};

export const useGetById = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.project(id),
    queryFn: () => projectService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGet = () => {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => projectService.get(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProject = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectPayload>({
    mutationFn: (payload) => projectService.create(payload),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(project.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      if (project) router.push(ROUTES.project(project.id));
      toast.success("Project created successfully");
    },
    onError: () => toast.error("Failed to create project. Please try again"),
  });
};

export const useEditProject = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const queryClient = useQueryClient();

  return useMutation<void, Error, EditProjectPayload>({
    mutationFn: (payload) => projectService.edit(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      toast.success("Project updated successfully");
    },
    onError: () => toast.error("Failed to edit project. Please try again."),
  });
};

export const useDeleteProject = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      router.replace(ROUTES.projects);
      toast.success("Project deleted successfully");
    },
    onError: () => toast.error("Failed to delete project. Please try again."),
  });
};

export const useLeaveProject = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: projectService.leave,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      router.replace(ROUTES.projects);
      toast.success("You have left the project");
    },
    onError: () => toast.error("Failed to leave project. Please try again."),
  });
};
