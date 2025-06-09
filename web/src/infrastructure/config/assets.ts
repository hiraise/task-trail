import { ICONS } from "./icons";

const basePath = process.env.NEXT_PUBLIC_ROOT_PATH;

export const ASSETS = {
  logo: {
    mobileSimple: `${basePath}/images/logo.png`,
    mobile: `${basePath}/images/logo-mobile.png`,
  },
  icons: {
    ...ICONS,
    image: "./icons/image.png",
  },
};
