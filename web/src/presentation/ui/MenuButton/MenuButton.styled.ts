import Link from "next/link";
import styled from "styled-components";

export const StyledMenuButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 41px;
  border-radius: 8px;
  border: 1px solid rgba(200, 200, 200, 1);
  background: none;
  padding: 12px;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background: var(--grey);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const StyledText = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 100%;
  vertical-align: middle;
`;
