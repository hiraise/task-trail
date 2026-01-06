import styled from "styled-components";

export const StyledText = styled.p`
  font-size: 12px;
  font-weight: 400;
  color: var(--grey-70);
  text-align: center;
  white-space: pre-line;
`;

export const StyledLink = styled.a`
  color: var(--grey-70);
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
`;
