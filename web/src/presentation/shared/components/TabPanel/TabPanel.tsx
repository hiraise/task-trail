import clsx from "clsx";

import { TEXTS } from "@/shared/locales/texts";

import { SubmitButton } from "../SubmitButton";

import type { TabItem } from "./TabPanel.types";
import { TabType } from "./TabPanel.types";
import { useTabPanel } from "./TabPanelContext";
import styles from "./TabPanel.module.css";

const tabs: TabItem[] = [
  { id: TabType.ACTIVE, label: TEXTS.tasks.active },
  { id: TabType.ARCHIVED, label: TEXTS.tasks.archived },
];

/**
 * the Active / Archived tabs (ADR-0027). On a phone — a segmented control, from 768 px — underlined tabs;
 * CSS switches the look (ADR-0008).
 */
export function TabPanel() {
  const { activeTab, setActiveTab } = useTabPanel();

  return (
    <div className={styles.tabsContainer} role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={clsx(styles.tab, { [styles.active]: activeTab === tab.id })}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          <SubmitButton variant="text" onClick={() => setActiveTab(tab.id)}>
            <span className={clsx("body-reg-2", styles.label)}>{tab.label}</span>
          </SubmitButton>
        </div>
      ))}
    </div>
  );
}
