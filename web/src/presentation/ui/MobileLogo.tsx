import Image from "next/image";

import { ASSETS } from "@/infrastructure/config/assets";
import { imagesTexts } from "@/shared/locales/images";

interface MobileLogoProps {
  src?: string;
  alt?: string;
}

export const MobileLogo = ({
  src = ASSETS.logo.mobile,
  alt = imagesTexts.mobileLogo,
}: MobileLogoProps) => {
  return (
    <div
      style={{
        position: "relative",
        width: "164px",
        height: "25px",
        marginTop: "25px",
      }}
    >
      <Image alt={alt} src={src} fill sizes="100vw" style={{ objectFit: "contain" }} priority />
    </div>
  );
};
