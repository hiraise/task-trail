import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { Board } from "@/domain/models/Board";
import type { Project } from "@/domain/models/Project";
import type { SearchResult } from "@/domain/models/SearchResult";
import type { Task } from "@/domain/models/Task";
import { searchTexts } from "@/shared/locales/search";

import { useSearch } from "../../hooks";

import { SearchPage } from "./SearchPage";

const navigate = vi.fn();
let routeSearch: { q?: string } = {};

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => routeSearch,
  useNavigate: () => navigate,
  useRouter: () => ({ history: { back: vi.fn() } }),
  useCanGoBack: () => false,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("../../hooks", () => ({ useSearch: vi.fn() }));

vi.mock("@/presentation/shared/components/domainComponents", () => ({
  ProjectCard: ({ project }: { project: Project }) => <div>project {project.name}</div>,
  BoardList: ({ boards }: { boards: Board[] }) => <div>boards {boards.length}</div>,
  ProjectTask: ({ taskKey }: { taskKey: string }) => <div>task {taskKey}</div>,
}));

vi.mock("@/presentation/shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useProjectMembers: () => ({ data: [] }),
}));

const results = (state: Partial<SearchResult>): ReturnType<typeof useSearch> =>
  ({ data: { projects: [], boards: [], tasks: [], ...state } }) as unknown as ReturnType<
    typeof useSearch
  >;

const project = { id: "p1", name: "Дизайн", key: "DS" } as Project;
const task = { id: "t1", projectId: "p1", key: "DS-1", name: "Макет" } as Task;

describe("SearchPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    routeSearch = {};
    navigate.mockReset();
    vi.mocked(useSearch).mockReturnValue({ data: undefined } as ReturnType<typeof useSearch>);
  });

  afterEach(() => vi.useRealTimers());

  it("an empty field shows the hint and is limited to 100 characters", () => {
    render(<SearchPage />);

    expect(screen.getByText(searchTexts.empty)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(searchTexts.placeholder)).toHaveAttribute("maxLength", "100");
  });

  it("searches the trimmed query after a pause and keeps it in the address", () => {
    render(<SearchPage />);

    fireEvent.change(screen.getByPlaceholderText(searchTexts.placeholder), {
      target: { value: "  ds " },
    });
    expect(vi.mocked(useSearch)).toHaveBeenLastCalledWith("");

    act(() => vi.advanceTimersByTime(300));

    expect(vi.mocked(useSearch)).toHaveBeenLastCalledWith("ds");
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ search: { q: "ds" }, replace: true }),
    );
  });

  it("nothing found", () => {
    routeSearch = { q: "zzz" };
    vi.mocked(useSearch).mockReturnValue(results({}));

    render(<SearchPage />);

    expect(screen.getByText(searchTexts.nothingFound)).toBeInTheDocument();
  });

  it("shows only non-empty groups; a group collapses", () => {
    routeSearch = { q: "ds" };
    vi.mocked(useSearch).mockReturnValue(results({ projects: [project], tasks: [task] }));

    render(<SearchPage />);

    expect(screen.getByText(searchTexts.projects)).toBeInTheDocument();
    expect(screen.queryByText(searchTexts.boards)).not.toBeInTheDocument();
    expect(screen.getByText("project Дизайн")).toBeInTheDocument();
    expect(screen.getByText("task DS-1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: searchTexts.collapse })[0]);

    expect(screen.queryByText("project Дизайн")).not.toBeInTheDocument();
    expect(screen.getByText("task DS-1")).toBeInTheDocument();
  });
});
