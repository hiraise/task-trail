import { sharedTexts } from "@/shared/locales/sharedTexts";
import { interpolate } from "@/shared/utils/interpolate";
import { StyledLink, StyledText } from "./PrivacyPolicyMobile.styled";

export function PrivacyPolicyMobile({ btnName = sharedTexts.login }: { btnName: string }) {
  return (
    <StyledText>
      {interpolate(sharedTexts.privacyPolicyAgreement, {
        btnName: btnName,
      })}
      <StyledLink href={sharedTexts.privacyPolicyLink} target="_blank" rel="noopener noreferrer">
        {sharedTexts.privacyPolicyText}
      </StyledLink>
    </StyledText>
  );
}
