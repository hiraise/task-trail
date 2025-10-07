import { ICONS } from "./icons";

const basePath = process.env.NEXT_PUBLIC_ROOT_PATH;

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
    hero: addBasePath("/images/hero.png"),
    passwordRecovery: addBasePath("/images/password-recovery-image.png"),
    resendVerification: addBasePath("/images/resend-verification-image.png"),
  },
};
