import { createContext, useContext } from "react";

// Окно, которое сменяет на экране другое окно стека, появляется сразу, без анимации появления:
// иначе затемнение гаснет и проявляется заново, а панель снова выезжает — экран моргает.
// Значение ставит GlobalModalManager, читает BaseModal.
export const ModalAppearContext = createContext(true);

/** true — окно открывается поверх экрана; false — сменяет другое окно и появляется сразу. */
export function useModalAppear() {
  return useContext(ModalAppearContext);
}
