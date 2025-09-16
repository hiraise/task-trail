import clsx from "clsx";

import styles from "./TabPanel.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { SubmitButton } from "../../auth/_components";
import { useTabPanel } from "./TabPanelContext";

export const enum TabType {
  ACTIVE,
  ARCHIVED,
}

export interface TabItem {
  id: TabType;
  label: string;
}

export function TabPanel() {
  const { activeTab, setActiveTab } = useTabPanel();

  const tabs: TabItem[] = [
    { id: TabType.ACTIVE, label: TEXTS.tasks.active },
    { id: TabType.ARCHIVED, label: TEXTS.tasks.archived },
  ];

  return (
    <div className={styles.tabsContainer} role="tablist" aria-label="Task filter tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={clsx(styles.tab, { [styles.active]: activeTab === tab.id })}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          <SubmitButton $variant="text" onClick={() => setActiveTab(tab.id)}>
            <span className="body-reg-2">{tab.label}</span>
          </SubmitButton>
        </div>
      ))}
    </div>
  );
}
