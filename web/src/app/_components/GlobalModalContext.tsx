"use client";
import { createContext, useContext, useState } from "react";

export const MODAL_TYPE = {
  CREATE_TASK: "CREATE_TASK",
  SORT_ITEMS: "SORT_ITEMS",
  CHANGE_STATUS: "CHANGE_STATUS",
  SELECT_ASSIGNEE: "SELECT_ASSIGNEE",
  SELECT_PROJECT: "SELECT_PROJECT",
  CREATE_PROJECT: "CREATE_PROJECT",
  INVITE_USER: "INVITE_USER",
  EDIT_TASK: "EDIT_TASK",
  MOVE_TO_ARCHIVE: "MOVE_TO_ARCHIVE",
  DELETE: "DELETE",
  EDIT_PROJECT: "EDIT_PROJECT",
  LEAVE_PROJECT: "LEAVE_PROJECT",
  PROJECT_SETTINGS: "PROJECT_SETTINGS",
  CROP_IMAGE: "CROP_IMAGE",
} as const;

export type ModalType = (typeof MODAL_TYPE)[keyof typeof MODAL_TYPE];

type ModalStackItem = {
  type: ModalType;
  props?: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: () => void;
};

interface GlobalModalContextProps {
  stack: ModalStackItem[];
  isOpen: (type: ModalType) => boolean;
  open: <T>(type: ModalType, props?: Record<string, unknown>) => Promise<T>;
  close: <T>(result?: T) => void;
  back: <T>(result?: T) => void;
}

const GlobalModalContext = createContext<GlobalModalContextProps | null>(null);

export function GlobalModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ModalStackItem[]>([]);

  const isOpen = (type: ModalType) => {
    return stack.length > 0 && stack[stack.length - 1].type === type;
  };

  const open = <T,>(type: ModalType, props?: Record<string, unknown>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const item: ModalStackItem = {
        type,
        props,
        resolve: resolve as (value: unknown) => void,
        reject,
      };
      setStack((prev) => [...prev, item]);
    });
  };

  const close = <T,>(result?: T) => {
    setStack((prev) => {
      const top = prev[prev.length - 1];
      if (result !== undefined && top?.resolve) {
        top.resolve(result);
      } else if (result === undefined && top?.reject) {
        top.reject();
      }
      return prev.slice(0, -1);
    });
  };

  const back = <T,>(result?: T) => close(result);

  return (
    <GlobalModalContext value={{ stack, isOpen, open, close, back }}>{children}</GlobalModalContext>
  );
}

export function useGlobalModalContext() {
  const context = useContext(GlobalModalContext);
  if (!context) throw new Error("useTaskModal must be used within TaskModalProvider");
  return context;
}
