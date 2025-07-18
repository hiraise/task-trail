import { useEffect } from "react";

export function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const isClickInside = refs.some((ref) =>
        ref.current?.contains(event.target as Node)
      );
      if (isClickInside) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [refs, handler]);
}
