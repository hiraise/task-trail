import Image from "next/image";

import { ASSETS } from "@/infrastructure/config/assets";
import { imagesTexts } from "@/shared/locales/images";
import styled from "styled-components";

const LogoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 25px;
  margin-top: 25px;
`;

interface MobileLogoProps {
  src?: string;
  alt?: string;
}

export const MobileLogo = ({
  src = ASSETS.logo.mobile,
  alt = imagesTexts.mobileLogo,
}: MobileLogoProps) => {
  return (
    <LogoContainer>
      <Image
        alt={alt}
        src={src}
        fill
        sizes="100vw"
        style={{ objectFit: "contain" }}
        priority
      />
    </LogoContainer>
  );
};
