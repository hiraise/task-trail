import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangeMemberRolePayload } from "@/application/payloads";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import { getUserDisplayName } from "@/domain/models/User";
import { projectMemberRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { projectsTexts } from "@/shared/locales/projects";
import { interpolate } from "@/shared/utils/interpolate";

/** The owner makes a member an admin or revokes that role. */
export function useChangeMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<ProjectMember, Error, ChangeMemberRolePayload>({
    mutationFn: ({ projectId, memberId, role }) =>
      projectMemberRepository.changeRole(projectId, memberId, role),
    onSuccess: (member, { projectId }) => {
      queryClient.setQueryData<ProjectMember[]>(QUERY_KEYS.project.members(projectId), (members) =>
        members?.map((current) => (current.id === member.id ? member : current)),
      );
      const template = member.role === "admin" ? projectsTexts.madeAdmin : projectsTexts.madeMember;

      toast.success(interpolate(template, { name: getUserDisplayName(member) }));
    },
    onError: (error) => toastError(error, projectsTexts.changeRoleFailed),
  });
}
