type Listener<T> = (value: T) => void;

export interface BaseStore<T> {
  data: T;
  listeners: Set<Listener<T>>;
  get: () => T;
  set: (partialData: Partial<T>) => void;
  subscribe: (listener: Listener<T>) => () => void;
  reset: () => void;
}

export function createStore<T, ExtraMethods = unknown>(
  initialState: T,
  extraMethods?: (store: BaseStore<T>) => ExtraMethods
): BaseStore<T> & ExtraMethods {
  const store: BaseStore<T> = {
    data: { ...initialState },
    listeners: new Set(),

    get() {
      return store.data;
    },

    set(partialData: Partial<T>) {
      store.data = { ...store.data, ...partialData };
      for (const listener of store.listeners) {
        try {
          listener(store.data);
        } catch (error) {
          console.error("Error in listener:", error);
        }
      }
    },

    subscribe(listener: Listener<T>) {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },

    reset() {
      store.data = { ...initialState };
      for (const listener of store.listeners) {
        try {
          listener(store.data);
        } catch (error) {
          console.error("Error in listener:", error);
        }
      }
    },
  };

  if (extraMethods) {
    return Object.assign(store, extraMethods(store));
  }

  return store as BaseStore<T> & ExtraMethods;
}
