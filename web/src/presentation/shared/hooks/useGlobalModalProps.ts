import { useGlobalModalContext } from "@/presentation/app";

export function useGlobalModalProps<T = unknown>(): T | undefined {
  const { stack } = useGlobalModalContext();
  const topModal = stack[stack.length - 1];

  return topModal?.props as T | undefined;
}
