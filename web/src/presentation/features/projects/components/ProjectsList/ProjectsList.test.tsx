import { vi } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Project } from "@/domain/models/Project";

import { ProjectsList } from "./ProjectsList";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => {
    const href = params ? to.replace(/\$(\w+)/g, (_, key) => params[key] ?? "") : to;

    return <a href={href}>{children}</a>;
  },
}));

vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: vi.fn(() => ({
    showCreateProject: vi.fn(),
  })),
}));

vi.mock("@/presentation/shared", () => ({
  EmptyListState: () => <div data-testid="empty-state">Empty State</div>,
}));

vi.mock("../ProjectCard", () => ({
  ProjectCard: ({ project }: { project: Project }) => (
    <div data-testid="project-card">
      <div>{project.name}</div>
      <div>{project.description}</div>
    </div>
  ),
}));

describe("ProjectsList", () => {
  let mockProjects: Project[];

  beforeEach(() => {
    mockProjects = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `Project ${i + 1}`,
      key: `P${i + 1}`,
      description: `Description for project ${i + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasksCount: (i + 1) * 10,
    }));
  });

  it("displays project names", () => {
    render(<ProjectsList projects={mockProjects} />);
    expect(screen.getByText(mockProjects[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockProjects[0].description ?? "")).toBeInTheDocument();
  });

  it("renders correctly ProjectCard components based on projects prop", () => {
    render(<ProjectsList projects={mockProjects} />);
    const projectCards = screen.getAllByTestId("project-card");

    expect(projectCards).toHaveLength(mockProjects.length);
  });

  it("renders EmptyListState when projects list is empty", () => {
    render(<ProjectsList projects={[]} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("renders link with correct href to project details page", () => {
    render(<ProjectsList projects={mockProjects} />);
    const expectedHref = `/projects/${mockProjects[0].id}`;

    const links = screen.getAllByRole("link");
    const link = links.find((l) => l.getAttribute("href") === expectedHref);

    expect(link).toBeDefined();
    expect(link).toHaveAttribute("href", expectedHref);
  });
});
