import styled from "styled-components";
import { ReactNode } from "react";

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: 42px;
  font-weight: 500;
`;

const Subtitle = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: var(--foreground);
  opacity: 0.5;
`;

interface SectionTitleProps {
  title: string;
  subtitle?: ReactNode;
}

export const SectionTitle = ({ title, subtitle }: SectionTitleProps) => {
  return (
    <TitleContainer>
      <Title>{title}</Title>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </TitleContainer>
  );
};
