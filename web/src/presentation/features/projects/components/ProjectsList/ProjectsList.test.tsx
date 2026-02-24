/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import type { Project } from "@/domain/models/Project";
import { ROUTES } from "@/shared/config/routes";

import { ProjectsList } from "./ProjectsList";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: jest.fn(() => ({
    showCreateProject: jest.fn(),
  })),
}));

jest.mock("@/presentation/shared", () => ({
  EmptyListState: () => <div data-testid="empty-state">Empty State</div>,
}));

jest.mock("../ProjectCard", () => ({
  ProjectCard: ({ project }: { project: any }) => (
    <div data-testid="project-card">
      <div>{project.name}</div>
      <div>{project.description}</div>
    </div>
  ),
}));

describe("ProjectsListDesktop", () => {
  let mockProjects: Project[];

  beforeEach(() => {
    mockProjects = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      name: `Project ${i + 1}`,
      description: `Description for project ${i + 1}`,
      createdAt: new Date().toISOString(),
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
    const expectedHref = ROUTES.project(mockProjects[0].id);

    const links = screen.getAllByRole("link");
    const link = links.find((l) => l.getAttribute("href") === expectedHref);

    expect(link).toBeDefined();
    expect(link).toHaveAttribute("href", expectedHref);
  });
});
