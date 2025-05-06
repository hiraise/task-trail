import styled from "styled-components";

import { sharedTexts } from "@/shared/locales/sharedTexts";

const StyledText = styled.p`
  font-size: 12px;
  font-weight: 400;
  color: var(--grey-70);
  text-align: center;
`;

const StyledLink = styled.a`
  color: var(--grey-70);
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
`;

export const PrivacyText = () => {
  return (
    <StyledText>
      {sharedTexts.privacyPolicyAgreement}{" "}
      <StyledLink
        href={sharedTexts.privacyPolicyLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        {sharedTexts.privacyPolicyText}
      </StyledLink>
    </StyledText>
  );
};
