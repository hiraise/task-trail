import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { createProjectDetails } from "@/domain/models/Project";
import type { TaskId } from "@/domain/types";
import { projectRepository, taskRepository, userRepository } from "@/infrastructure/repositories";

export async function getTaskDetailUseCase(taskId: TaskId): Promise<TaskDetailResponseDto> {
  try {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const [project, assignee, statuses] = await Promise.all([
      projectRepository.findById(task.projectId),
      task.assigneeId ? userRepository.findById(task.assigneeId) : Promise.resolve(null),
      projectRepository.getProjectStatuses(task.projectId),
    ]);

    const status = statuses.find((s) => s.id === task.statusId);

    if (!status) {
      throw new Error(`Status with id ${task.statusId} not found for task ${taskId}`);
    }

    return {
      task,
      project: createProjectDetails(project),
      assignee,
      status,
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to fetch task details");
  }
}
