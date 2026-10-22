import { useState } from "react";

/**
 * Focus within the form: moving between its fields and buttons does not drop focus, unlike
 * onFocus/onBlur on a single field.
 */
export function useFocusWithin() {
  const [focused, setFocused] = useState(false);

  const focusHandlers = {
    onFocus: () => setFocused(true),
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
    },
  };

  return { focused, setFocused, focusHandlers };
}
