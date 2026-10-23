import { ICONS } from "../../shared/config/icons";

// App path (VITE_ROOT_PATH, web/README.md); the root when the variable is unset
const basePath = import.meta.env.VITE_ROOT_PATH ?? "";

function addBasePath(path: string) {
  return basePath + path;
}

export const ASSETS = {
  placeholder: {
    image: addBasePath("/images/image.png"),
  },
  logo: {
    mobileSimple: addBasePath("/images/logo.png"),
    mobile: addBasePath("/images/logo-mobile.png"),
  },
  icons: {
    ...ICONS,
  },
  images: {
    task: addBasePath("/images/task.png"),
    project: addBasePath("/images/project.png"),
    board: addBasePath("/images/board.png"),
    search: addBasePath("/images/search.png"),
    nothingFound: addBasePath("/images/nothing-found.svg"),
    hero: addBasePath("/images/hero.png"),
    passwordRecovery: addBasePath("/images/password-recovery-image.png"),
  },
};
