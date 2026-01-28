/*
id:18
name:"Создаем задачу в десктопной версии"
description:"Проверка создания задчи из десктопной версии"
statusId:16
createdAt:"2025-09-19T17:37:59.960212Z"
updatedAt:"2025-10-29T16:03:59.085243Z"
authorId:1
assigneeId:1
projectId:5
*/

export interface TaskDTO {
  id: number;
  name: string;
  description?: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  authorId: number;
  assigneeId?: number;
}

export interface TaskIdDTO {
  id: number;
}

export interface TaskStatusDTO {
  id: number;
  name: string;
  isDefault: boolean;
  isResolved: boolean;
}
