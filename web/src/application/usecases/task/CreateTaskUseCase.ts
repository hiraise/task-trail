import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { CreateTaskPayload } from "@/application/payloads";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type CreateTaskUseCase = (payload: CreateTaskPayload) => Promise<TaskResponseDto>;

const createCreateTaskUseCase =
  (taskRepository: TaskRepository): CreateTaskUseCase =>
  async (payload) => {
    try {
      clientLogger.info("CreateTaskUseCase: Creating new task", { name: payload.name });

      const taskId = await taskRepository.create({
        name: payload.name,
        description: payload.description,
        assigneeId: payload.assigneeId,
        projectId: ProjectId.create(payload.projectId),
      });

      clientLogger.info("Task created successfully", { taskId: taskId.toString() });
      const createdTask = await taskRepository.findById(taskId);

      return TaskResponseMapper.fromDomain(createdTask);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createCreateTaskUseCase, type CreateTaskUseCase };
