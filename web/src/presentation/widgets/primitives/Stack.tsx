import styled from "styled-components";
import React, { ReactNode } from "react";

interface StackProps {
  children: ReactNode;
  gap?: string;
}

const StyledStack = styled.div.withConfig({ displayName: "Stack" })<{
  $gap: string;
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap};
`;

export const Stack: React.FC<StackProps> = ({ children, gap = "16px" }) => {
  return <StyledStack $gap={gap}>{children}</StyledStack>;
};
