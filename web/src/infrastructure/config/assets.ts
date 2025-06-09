import { ICONS } from "./icons";

function addBasePath(path: string) {
  return process.env.NEXT_PUBLIC_BASE_PATH + path;
}

export const ASSETS = {
  logo: {
    mobileSimple: addBasePath("/images/logo.png"),
    mobile: addBasePath("/images/logo-mobile.png"),
  },
  icons: {
    ...ICONS,
    image: addBasePath("/icons/image.png"),
  },
};
