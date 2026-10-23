import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";

import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectId, ProjectRole } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { tasksTexts } from "@/shared/locales/tasks";

import { useProjectMenuItems } from "./useProjectMenuItems";

const showProjectLabels = vi.fn();

vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ showProjectLabels }),
}));

const projectId = "5c3f8e21-9b4d-4e6a-8f12-3a4b5c6d7e80" as ProjectId;

function project(role: ProjectRole, archivedAt?: string): ProjectDetails {
  return {
    id: projectId,
    name: "Дизайн-система",
    key: "DS",
    archivedAt,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: "2026-10-01T10:00:00Z",
    tasksCount: 3,
    role,
  };
}

function menu(details: ProjectDetails) {
  const queryClient = new QueryClient();

  queryClient.setQueryData(QUERY_KEYS.project.detail(projectId), details);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useProjectMenuItems(projectId), { wrapper }).result.current.menuItems;
}

describe("project menu: labels (ADR-0035)", () => {
  it("a member sees «Метки», and it opens the project labels", () => {
    const item = menu(project("member")).find((entry) => entry.label === tasksTexts.labels);

    expect(item).toBeDefined();
    act(() => item?.onClick());
    expect(showProjectLabels).toHaveBeenCalledWith(projectId);
  });

  it("an archived project still shows «Метки» — a read-only view", () => {
    const labels = menu(project("owner", "2026-10-20T10:00:00Z")).map((entry) => entry.label);

    expect(labels).toContain(tasksTexts.labels);
  });
});
