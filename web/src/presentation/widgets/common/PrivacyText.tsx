import styled from "styled-components";

import { sharedTexts } from "@/shared/locales/sharedTexts";
import { interpolate } from "@/shared/utils/interpolate";

const StyledText = styled.p`
  font-size: 12px;
  font-weight: 400;
  color: var(--grey-70);
  text-align: center;
  white-space: pre-line;
`;

const StyledLink = styled.a`
  color: var(--grey-70);
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
`;

export default function PrivacyText({
  btnName = sharedTexts.login,
}: {
  btnName: string;
}) {
  return (
    <StyledText>
      {interpolate(sharedTexts.privacyPolicyAgreement, {
        btnName: btnName,
      })}
      <StyledLink
        href={sharedTexts.privacyPolicyLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {sharedTexts.privacyPolicyText}
      </StyledLink>
    </StyledText>
  );
}
