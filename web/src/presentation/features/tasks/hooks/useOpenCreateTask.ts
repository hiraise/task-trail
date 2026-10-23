import type { ProjectId, TaskStatusId, UserId } from "@/domain/types";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";

import { useCreateTaskFormStore } from "../store/createTaskFormStore";

export interface OpenCreateTaskOptions {
  /** A project page: the form opens with this project preselected */
  projectId?: ProjectId;
  /** A board: the choice is limited to the board projects (ADR-0029) */
  allowedProjectIds?: ProjectId[];
  /** A kanban column: the task starts in its status */
  statusId?: TaskStatusId;
  /**
   * A kanban swimlane: its user is the assignee; the form drops them if they are not a member
   * of the chosen project. Used only together with `statusId`
   */
  assigneeId?: UserId;
}

/** Opens the new task form; the draft keeps the name and description between openings. */
export function useOpenCreateTask() {
  const { showCreateTask } = useGlobalModals();

  return ({ projectId, allowedProjectIds, statusId, assigneeId }: OpenCreateTaskOptions = {}) => {
    const { setProjectId, limitProjects, setStatusId, setAssigneeId } = useCreateTaskFormStore.getState();

    if (projectId) setProjectId(projectId);
    limitProjects(allowedProjectIds);
    setStatusId(statusId);
    // A cell of the kanban sets both: the "no assignee" lane clears the draft's assignee
    if (statusId) setAssigneeId(assigneeId);

    return showCreateTask();
  };
}
