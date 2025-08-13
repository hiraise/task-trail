export const TAG_TYPES = {
  PROJECT: "Project",
  MEMBER: "Member",
  CANDIDATE: "ProjectCandidate",
} as const;

export interface KickMemberArgs {
  projectId: number;
  memberId: number;
}

export interface LeaveProjectArgs {
  projectId: number;
}
