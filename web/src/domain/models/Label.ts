import type { LabelId, ProjectId } from "../types";

/** A fixed palette (ADR-0035); the web draws each color with `--label-<color>-bg/-text` tokens. */
export type LabelColor = "gray" | "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple";

/** The palette in the order of the color picker (ADR-0035). */
export const LABEL_COLORS: readonly LabelColor[] = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
];

/** A task has at most this many labels (ADR-0035). */
export const MAX_TASK_LABELS = 10;

/** A label of one project (ADR-0035) */
export interface Label {
  id: LabelId;
  projectId: ProjectId;
  /** 1–30 characters, unique in the project ignoring case */
  name: string;
  color: LabelColor;
}
