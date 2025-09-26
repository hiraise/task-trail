import { createContext, useContext, useState } from "react";
import { TabType } from "./TabPanel.types";

interface TabPanelValue {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}

const TabPanelContext = createContext<TabPanelValue | undefined>(undefined);

export function TabPanelProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.ACTIVE);

  return <TabPanelContext value={{ activeTab, setActiveTab }}>{children}</TabPanelContext>;
}

export const useTabPanel = (): TabPanelValue => {
  const context = useContext(TabPanelContext);
  if (!context) throw new Error("useTabPanel must be used within a TabPanelProvider");
  return context;
};
