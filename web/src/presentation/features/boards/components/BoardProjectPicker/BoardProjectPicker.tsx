import clsx from "clsx";
import { useMemo, useState } from "react";

import type { BoardProject } from "@/domain/models/Board";
import type { Project } from "@/domain/models/Project";
import type { ProjectId } from "@/domain/types";
import { ArchiveTag, CheckBox, SearchField } from "@/presentation/shared";
import { boardsTexts } from "@/shared/locales/boards";
import { TEXTS } from "@/shared/locales/texts";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import styles from "./BoardProjectPicker.module.css";

interface PickerItem {
  id: ProjectId;
  name: string;
  description?: string;
  tasksCount?: number;
  archived: boolean;
}

interface BoardProjectPickerProps {
  /** The user's active projects */
  projects: Project[];
  /** Board projects outside `projects` — archived ones (ADR-0027) */
  extraProjects?: BoardProject[];
  selectedIds: ProjectId[];
  onToggle: (id: ProjectId) => void;
}

/**
 * Projects for a board (frames 1775:149125, 1340:66557): search, the selected ones on top, the whole
 * card toggles the choice. The order is fixed when the picker opens — cards do not jump on a click.
 */
export function BoardProjectPicker({ projects, extraProjects = [], selectedIds, onToggle }: BoardProjectPickerProps) {
  const [query, setQuery] = useState("");
  const [initialSelected] = useState(selectedIds);

  const items = useMemo<PickerItem[]>(() => {
    const all: PickerItem[] = [
      ...projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        tasksCount: p.tasksCount,
        archived: false,
      })),
      ...extraProjects
        .filter((extra) => !projects.some((p) => p.id === extra.id))
        .map((p) => ({ id: p.id, name: p.name, archived: true })),
    ];
    const selectedFirst = (item: PickerItem) => (initialSelected.includes(item.id) ? 0 : 1);

    return all.sort((a, b) => selectedFirst(a) - selectedFirst(b));
  }, [projects, extraProjects, initialSelected]);

  const needle = query.trim().toLowerCase();
  const found = needle
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) || item.description?.toLowerCase().includes(needle),
      )
    : items;

  return (
    <div className={styles.container}>
      <SearchField
        id="boardProjectQuery"
        type="text"
        placeholder={TEXTS.projects.titlePlaceholder}
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.list}>
        {items.length === 0 && <p className="body-reg-2">{boardsTexts.noProjects}</p>}
        {items.length > 0 && found.length === 0 && (
          <p className="body-reg-2">{boardsTexts.projectsNotFound}</p>
        )}
        {found.map((item) => {
          const selected = selectedIds.includes(item.id);

          return (
            // The whole card toggles the choice; the checkbox is the keyboard control
            <div
              key={item.id}
              className={clsx(styles.card, selected && styles.selected)}
              onClick={() => onToggle(item.id)}
            >
              <div className={styles.header}>
                <h4 className={styles.name}>{item.name}</h4>
                {/* A click on the checkbox must not reach the card and toggle twice */}
                <span onClick={(event) => event.stopPropagation()}>
                  <CheckBox checked={selected} onChange={() => onToggle(item.id)} />
                </span>
              </div>
              {item.description && (
                <span className={clsx("body-reg-2", styles.description)}>{item.description}</span>
              )}
              <div className={styles.footer}>
                {item.archived && <ArchiveTag />}
                {item.tasksCount !== undefined && (
                  <span className={clsx("caption-reg", styles.count)}>{pluralizeTasks(item.tasksCount)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
