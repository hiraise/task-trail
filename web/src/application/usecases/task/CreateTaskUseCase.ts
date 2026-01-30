import type { CreateTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type CreateTaskUseCase = (payload: CreateTaskPayload) => Promise<Task>;

const createCreateTaskUseCase =
  (taskRepository: TaskRepository): CreateTaskUseCase =>
  async (payload) => {
    try {
      clientLogger.info("CreateTaskUseCase: Creating new task", { name: payload.name });

      const taskId = await taskRepository.create({
        name: payload.name,
        description: payload.description,
        assigneeId: payload.assigneeId,
        projectId: payload.projectId,
      });

      clientLogger.info("Task created successfully", { taskId: taskId.toString() });
      const createdTask = await taskRepository.findById(taskId);

      return createdTask;
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createCreateTaskUseCase, type CreateTaskUseCase };
