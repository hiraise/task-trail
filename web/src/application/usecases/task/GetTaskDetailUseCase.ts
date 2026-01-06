import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import { TaskStatusResponseMapper } from "@/application/dto/TaskStatusResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { UserId } from "@/domain/valueobjects/UserId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetTaskDetailUseCase {
  constructor(
    private taskRepository: TaskRepository,
    private userRepository: UserRepository,
    private projectRepository: ProjectRepository,
  ) {}

  async execute(taskId: string | number): Promise<TaskDetailResponseDto> {
    try {
      clientLogger.info("GetTaskDetailUseCase: Fetching task details", { taskId });

      const id = TaskId.create(taskId);
      const task = await this.taskRepository.findById(id);

      if (!task) throw new Error(`Task with id ${taskId} not found`);

      const assigneeId = UserId.create(task.assigneeId ?? -1);

      const [project, assignee, statuses] = await Promise.all([
        this.projectRepository.findById(task.projectId),
        task.assigneeId ? this.userRepository.findById(assigneeId) : null,
        this.projectRepository.getProjectStatuses(task.projectId),
      ]);

      const status = statuses.find((status) => status.id === task.statusId);

      if (!project) throw new Error(`Project not found`);
      if (!assignee) throw new Error(`Assignee not found`);
      if (!status) throw new Error(`Status not found`);

      clientLogger.info("GetTaskDetailUseCase: Task detail fetched", { taskId });

      const response: TaskDetailResponseDto = {
        task: TaskResponseMapper.fromDomain(task),
        project: ProjectResponseMapper.fromDomain(project),
        assignee: UserResponseMapper.fromDomain(assignee),
        status: TaskStatusResponseMapper.fromDomain(status),
      };

      return response;
    } catch (error) {
      clientLogger.error("GetTaskDetailUseCase: failed", { error, taskId });
      throw error;
    }
  }
}
