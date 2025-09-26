export const enum TabType {
  ACTIVE,
  ARCHIVED,
}

export interface TabItem {
  id: TabType;
  label: string;
}
