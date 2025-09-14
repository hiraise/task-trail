import { interpolate } from "@/shared/utils/interpolate";
import { StyledLink, StyledText } from "./PrivacyPolicyMobile.styled";
import { authTexts } from "@/shared/locales/auth";

export function PrivacyPolicyMobile({ btnName }: { btnName: string }) {
  return (
    <StyledText>
      {interpolate(authTexts.privacyPolicy.text, {
        btnName: btnName,
      })}
      <StyledLink
        href={authTexts.privacyPolicy.buttonLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {authTexts.privacyPolicy.buttonText}
      </StyledLink>
    </StyledText>
  );
}
