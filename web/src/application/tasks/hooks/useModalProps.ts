import { useTaskModal } from "@/app/tasks/TaskModalContext";

export function useModalProps<T = unknown>(): T | undefined {
  const { stack } = useTaskModal();
  const topModal = stack[stack.length - 1];
  return topModal?.props as T | undefined;
}
