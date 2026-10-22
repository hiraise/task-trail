import { createContext, useContext } from "react";

// A modal that replaces another modal of the stack on screen appears at once, without the enter animation:
// otherwise the overlay fades out and in again and the panel slides in again, and the screen flickers.
// GlobalModalManager sets the value, BaseModal reads it.
export const ModalAppearContext = createContext(true);

/** true: the modal opens over the screen; false: it replaces another modal and appears at once. */
export function useModalAppear() {
  return useContext(ModalAppearContext);
}
