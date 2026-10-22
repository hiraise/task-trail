import { useState } from "react";

/**
 * Фокус внутри формы: переход между её полями и кнопками фокус не снимает, в отличие от
 * onFocus/onBlur на отдельном поле.
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
