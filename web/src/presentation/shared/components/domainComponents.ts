/**
 * Feature components shown by other features, like search showing project, board and task cards.
 * Features do not import each other (eslint.config.js); they import these re-exports, as with
 * domainHooks.ts. Not exported from the shared index: the components import the shared index.
 */

export { BoardList } from "@/presentation/features/boards/components/BoardList";
export { ProjectCard } from "@/presentation/features/projects/components/ProjectCard";
export { ProjectTask } from "@/presentation/features/projects/components/ProjectTask";
