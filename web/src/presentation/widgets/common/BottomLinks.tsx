import styled from "styled-components";
import Link from "next/link";

import { TextButton } from "../../ui/TextButton";

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;

const StyledText = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: var(--dark-grey);
`;

interface TextButtonProps {
  text: string;
  href: string;
  buttonText: string;
}

export function BottomLinks({ text, href, buttonText }: TextButtonProps) {
  return (
    <LinksContainer>
      <StyledText>{text}</StyledText>
      <Link href={href} passHref>
        <TextButton $weight={500}>{buttonText}</TextButton>
      </Link>
    </LinksContainer>
  );
}
