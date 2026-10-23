import { Link, useCanGoBack, useNavigate, useRouter, useSearch as useRouteSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import type { SearchResult } from "@/domain/models/SearchResult";
import { EmptyListState, Icon, IconButton } from "@/presentation/shared";
import { BoardList, ProjectCard } from "@/presentation/shared/components/domainComponents";
import { useDebouncedValue } from "@/presentation/shared/hooks";
import { ASSETS } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { searchTexts } from "@/shared/locales/search";

import { SearchGroup, SearchTaskList } from "../../components";
import { useSearch } from "../../hooks";

import styles from "./SearchPage.module.css";

/** The server takes 1–100 characters (ADR-0030) */
const QUERY_MAX_LENGTH = 100;
const DEBOUNCE_MS = 300;

/**
 * Search across projects, boards and tasks (ADR-0030). One screen for all widths (ADR-0008):
 * on a phone — the field with a cancel button and no bottom bar, the keyboard opens at once
 * (comment 1220:96792); wider — a card with the search icon and a clear button.
 * The query is kept in `?q=`: going back from a found task returns to the same results.
 */
export function SearchPage() {
  const { q = "" } = useRouteSearch({ from: "/_main/search/" });
  const navigate = useNavigate();
  const [value, setValue] = useState(q);
  const debounced = useDebouncedValue(value, DEBOUNCE_MS).trim();
  const { data } = useSearch(debounced);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounced !== q) {
      navigate({ to: ROUTES.search, search: { q: debounced || undefined }, replace: true });
    }
  }, [debounced, q, navigate]);

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <div className={clsx(styles.searchIcon, styles.wideOnly)}>
          <Icon as={ICONS.search} size="24px" inheritColor />
        </div>
        <div className={styles.field}>
          <input
            ref={inputRef}
            type="search"
            className={clsx("body-reg-2", styles.input)}
            placeholder={searchTexts.placeholder}
            aria-label={searchTexts.placeholder}
            maxLength={QUERY_MAX_LENGTH}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
            enterKeyHint="search"
          />
          {value && (
            <IconButton
              icon={ICONS.close}
              className={styles.clear}
              aria-label={searchTexts.clear}
              onClick={clear}
            />
          )}
        </div>
        <CancelButton />
      </div>

      <div className={styles.content}>
        <SearchContent value={value} query={debounced} data={data} />
      </div>
    </div>
  );
}

interface SearchContentProps {
  /** What is in the field now */
  value: string;
  /** What was searched: the field after the pause, trimmed */
  query: string;
  data?: SearchResult;
}

function SearchContent({ value, query, data }: SearchContentProps) {
  if (!value.trim()) {
    return (
      <EmptyListState src={ASSETS.images.search} alt={searchTexts.empty} text={searchTexts.empty} />
    );
  }
  if (!data) return null;

  const { projects, boards, tasks } = data;

  if (projects.length + boards.length + tasks.length === 0) {
    return (
      <EmptyListState
        src={ASSETS.images.nothingFound}
        alt={searchTexts.nothingFound}
        text={searchTexts.nothingFound}
      />
    );
  }

  return (
    <>
      {projects.length > 0 && (
        <SearchGroup title={searchTexts.projects}>
          <div className={styles.projects}>
            {projects.map((project) => (
              <Link key={project.id} to="/projects/$id" params={{ id: project.id }}>
                <ProjectCard project={project} highlight={query} />
              </Link>
            ))}
          </div>
        </SearchGroup>
      )}
      {boards.length > 0 && (
        <SearchGroup title={searchTexts.boards}>
          <BoardList boards={boards} highlight={query} />
        </SearchGroup>
      )}
      {tasks.length > 0 && (
        <SearchGroup title={searchTexts.tasks}>
          <SearchTaskList tasks={tasks} highlight={query} />
        </SearchGroup>
      )}
    </>
  );
}

/** The phone cancel button: back where the user came from, or to the projects. */
function CancelButton() {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      className={clsx("btn-font-s", styles.cancel, styles.phoneOnly)}
      onClick={() => (canGoBack ? router.history.back() : navigate({ to: ROUTES.projects }))}
    >
      {searchTexts.cancel}
    </button>
  );
}
