import { createContext, ReactNode, useContext, useState } from "react";

export interface SheetType {
  type: string;
  props?: unknown;
}

interface BottomSheetContextType {
  stack: SheetType[];
  openSheet: (sheet: SheetType) => void;
  closeAllSheets: () => void;
  backSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType | null>(null);

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<SheetType[]>([]);

  const openSheet = (sheet: SheetType) => setStack((prev) => [...prev, sheet]);

  const closeAllSheets = () => setStack([]);

  const backSheet = () => setStack((prev) => prev.slice(0, -1));
  return (
    <BottomSheetContext
      value={{
        stack,
        openSheet,
        closeAllSheets,
        backSheet,
      }}
    >
      {children}
    </BottomSheetContext>
  );
}

export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
}
