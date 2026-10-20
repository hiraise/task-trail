export const TabType = {
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

export type TabType = (typeof TabType)[keyof typeof TabType];

export interface TabItem {
  id: TabType;
  label: string;
}
