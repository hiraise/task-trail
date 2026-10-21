import type { CreateTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import { taskRepository } from "@/infrastructure/repositories";

export async function createTaskUseCase(payload: CreateTaskPayload): Promise<Task> {
  const taskId = await taskRepository.create({
    name: payload.name,
    description: payload.description,
    assigneeId: payload.assigneeId,
    projectId: payload.projectId,
  });

  const createdTask = await taskRepository.findById(taskId);

  return createdTask;
}
