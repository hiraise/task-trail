import { useSyncExternalStore } from "react";
import type { BaseStore } from "../store/baseStore";

export function useStore<T, TResult>(
  store: BaseStore<T>,
  selector: (state: T) => TResult
): TResult {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get())
  );
}
