export interface BaseStore<T> {
  data: T;
  listeners: Set<(value: T) => void>;
  get: () => T;
  set: (partialData: Partial<T>) => void;
  subscribe: (listener: (value: T) => void) => () => void;
  reset: () => void;
}
