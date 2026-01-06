import type { TaskCommentResponseDto } from "@/application/dto/TaskCommentResponseDto";

export const mockComments: TaskCommentResponseDto[] = [
  {
    id: 1,
    author: {
      id: 101,
      username: "Иван Иванов",
      email: "ivan1@example.com",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
    },
    createdAt: "2025-09-01T10:00:00.000Z",
    text: "Первый комментарий к задаче.",
    canEdit: true,
    canDelete: true,
  },
  {
    id: 2,
    author: {
      id: 102,
      username: "Петр Петров",
      email: "petr2@example.com",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
    },
    createdAt: "2025-09-01T10:05:00.000Z",
    updatedAt: "2025-09-01T10:06:00.000Z",
    text: "Второй комментарий к задаче.",
    canEdit: false,
    canDelete: false,
  },
  {
    id: 3,
    author: {
      id: 103,
      username: "Сергей Сергеев",
      email: "sergey3@example.com",
      avatarUrl: "https://i.pravatar.cc/150?img=3",
    },
    createdAt: "2025-09-01T10:10:00.000Z",
    text: "Третий комментарий к задаче.",
    canEdit: false,
    canDelete: false,
  },
];
