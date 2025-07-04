import { useEffect } from "react";

/**
 * A React hook that locks or unlocks scrolling on the `<body>` element
 * based on the `active` parameter.
 *
 * When `active` is `true`, the body's overflow is set to `"hidden"`,
 * preventing the user from scrolling the page. When `active` is `false`,
 * the overflow style is reset, restoring normal scrolling behavior.
 *
 * The effect cleans up after itself by resetting the overflow style
 * when the component unmounts or when `active` changes.
 *
 * @param active - If `true`, scrolling is locked; if `false`, scrolling is enabled.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
}
