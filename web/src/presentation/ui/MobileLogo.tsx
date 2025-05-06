import Image from "next/image";

import { ASSETS } from "@/infrastructure/config/assets";
import { imagesTexts } from "@/shared/locales/images";
import styled from "styled-components";

const LogoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 25px;
  margin-top: 24px;
`;

export const MobileLogo = () => {
  return (
    <LogoContainer>
      <Image
        alt={imagesTexts.mobileLogo}
        src={ASSETS.logo.mobile}
        fill
        sizes="100vw"
        style={{ objectFit: "contain" }}
        priority
      />
    </LogoContainer>
  );
};
