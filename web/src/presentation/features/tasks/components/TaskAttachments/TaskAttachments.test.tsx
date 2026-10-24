import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Attachment } from "@/domain/models/Attachment";
import type { Task } from "@/domain/models/Task";
import type { ProjectRole } from "@/domain/types";
import { taskRepository } from "@/infrastructure/repositories";

import { TaskAttachments } from "./TaskAttachments";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/infrastructure/repositories", () => ({
  taskRepository: { findAttachments: vi.fn(), uploadAttachment: vi.fn(), deleteAttachment: vi.fn() },
  fileRepository: { download: vi.fn() },
}));
vi.mock("@/presentation/shared/hooks", () => ({
  useGetCurrentUser: () => ({ data: { id: "maria" } }),
}));
vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ showConfirm: vi.fn() }),
}));

const task = { id: "task", projectId: "project" } as Task;

const attachment = (fields: Partial<Attachment>): Attachment => ({
  id: "file",
  taskId: "task",
  name: "макет.png",
  mimeType: "image/png",
  size: 2.4 * 1024 * 1024,
  author: { id: "anna", email: "anna@example.com", username: "Анна Петрова" },
  createdAt: "2026-10-27T10:00:00Z",
  ...fields,
});

function renderBlock(role: ProjectRole = "member", readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <TaskAttachments task={task} role={role} readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("TaskAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("an image shows a preview, another file the icon; size, author and date under the name", async () => {
    vi.mocked(taskRepository.findAttachments).mockResolvedValue([
      attachment({ id: "png", name: "макет.png" }),
      attachment({ id: "pdf", name: "требования.pdf", mimeType: "application/pdf", size: 312 * 1024 }),
    ]);

    renderBlock();

    const preview = await screen.findByRole("img", { name: "макет.png" });

    expect(preview.getAttribute("src")).toMatch(/\/v1\/files\/png$/);
    expect(screen.getAllByTestId("attachment-file-icon")).toHaveLength(1);
    expect(screen.getByText(/^2,4\sМБ · Анна Петрова · 27\.10\.2026$/)).toBeInTheDocument();
  });

  it("«Удалить» is hidden on another member's file, shown on one's own", async () => {
    const user = userEvent.setup();

    vi.mocked(taskRepository.findAttachments).mockResolvedValue([
      attachment({ id: "theirs", name: "чужой.png" }),
      attachment({ id: "mine", name: "мой.png", author: { id: "maria", email: "m@example.com", username: "Мария" } }),
    ]);

    renderBlock("member");
    const [theirs, mine] = await screen.findAllByRole("button", { name: "Действия с файлом" });

    await user.click(theirs);
    expect(screen.getByRole("menuitem", { name: "Скачать" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Удалить" })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(mine);
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toBeInTheDocument();
  });

  it("a file over 25 MB is not sent, the others are uploaded", async () => {
    const user = userEvent.setup();

    vi.mocked(taskRepository.findAttachments).mockResolvedValue([]);
    vi.mocked(taskRepository.uploadAttachment).mockResolvedValue(attachment({ name: "small.txt" }));

    renderBlock();
    expect(await screen.findByText("Файлов пока нет")).toBeInTheDocument();

    const big = new File(["x"], "video.mp4", { type: "video/mp4" });
    const small = new File(["hello"], "small.txt", { type: "text/plain" });

    Object.defineProperty(big, "size", { value: 30 * 1024 * 1024 });
    await user.upload(screen.getByTestId("attachment-input"), [big, small]);

    expect(toast.error).toHaveBeenCalledWith("Файл «video.mp4» больше 25 МБ");
    await waitFor(() => expect(taskRepository.uploadAttachment).toHaveBeenCalledTimes(1));
    expect(taskRepository.uploadAttachment).toHaveBeenCalledWith("task", small);
  });

  it("an archived task has no «Добавить файл»", async () => {
    vi.mocked(taskRepository.findAttachments).mockResolvedValue([]);

    renderBlock("owner", true);

    expect(await screen.findByText("Файлов пока нет")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Добавить файл" })).not.toBeInTheDocument();
  });
});
