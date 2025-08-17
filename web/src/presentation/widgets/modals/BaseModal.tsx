import styled from "styled-components";

import { BaseModalComponentProps } from "./modal.types";
import { BottomSheet } from "@/presentation/ui/BottomSheet/BottomSheet";
import { BackButton } from "@/presentation/ui/BackButton/BackButton";

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
`;

const StyledBackButton = styled(BackButton)`
  position: absolute;
  left: 0;
`;

const StyledTitle = styled.h2`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
`;

export function BaseModal<T = void>({
  children,
  showBackButton = true,
  title,
  ...props
}: BaseModalComponentProps<T>) {
  const { isOpen, onClose, onBack, fullScreen } = props;
  return (
    //TODO: refactor passing fullScreen prop
    // to BottomSheet, it should be handled in the component itself
    <BottomSheet isOpen={isOpen} onClose={onClose} fullScreen={fullScreen}>
      <StyledContainer>
        {onBack && showBackButton && <StyledBackButton onClick={onBack} showLabel={false} />}
        {title && <StyledTitle>{title}</StyledTitle>}
      </StyledContainer>
      {children}
    </BottomSheet>
  );
}
