import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LeaveProjectPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Custom hook to handle the process of leaving a project.
 *
 * This hook provides a mutation that allows a user to leave a project by calling the `leaveProject` function
 * from the `projectMemberRepository`. It also manages query invalidation and navigation upon success or failure.
 *
 * @returns A mutation object from `useMutation` that can be used to trigger the leave project action.
 *
 * @example
 * const leaveProjectMutation = useLeaveProject();
 * leaveProjectMutation.mutate({ projectId: "123" });
 *
 * @remarks
 * - On success, the hook removes related project queries from the cache, navigates to the projects page,
 *   and displays a success toast message.
 * - On error, it logs the error and displays an error toast message.
 * - On settled (whether success or error), it invalidates the projects query to ensure data consistency.
 *
 * @see {@link useMutation} for more details on the mutation object.
 * @see {@link QUERY_KEYS} for query key definitions.
 */
export function useLeaveProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { leaveProject } = projectMemberRepository;

  return useMutation<void, Error, LeaveProjectPayload>({
    mutationFn: (payload) => leaveProject(payload.projectId),
    onSuccess: (_, { projectId }) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project.detail(projectId) });
      navigate({ to: "/projects", replace: true });
      toast.success("You have left the project");
    },
    onError: (error) => {
      logger.error("Failed to leave project", { error });
      toast.error("Failed to leave project. Please try again.");
    },
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invalidate.project(projectId) });
    },
  });
}
