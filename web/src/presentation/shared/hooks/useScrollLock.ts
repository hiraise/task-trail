import { useEffect } from "react";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (active) {
      // Store original scroll position
      const scrollY = window.scrollY;

      // Add classes and prevent scroll
      document.body.classList.add("no-doc-scroll");
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restore scroll position
        document.body.classList.remove("no-doc-scroll");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [active]);
}
