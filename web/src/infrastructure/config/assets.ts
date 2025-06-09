import { ICONS } from "./icons";

const basePath = process.env.NEXT_PUBLIC_ROOT_PATH;

function addBasePath(path: string) {
  return basePath + path;
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
