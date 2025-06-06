import styled from "styled-components";

export const HeaderContainer = styled.header<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  padding: 0 20px;
  padding-top: 20px;
  padding-bottom: 40px;
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: top;
  z-index: 1000;
  border-bottom: 1px solid #cbcbcb;
  background: var(--background);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $visible }) =>
    $visible ? "translateY(0)" : "translateY(-100%)"};
`;

export const HeaderButtonsContainer = styled.div`
  display: flex;
  gap: 20px;
`;

export const LogoContainer = styled.div`
  position: relative;
  width: 164px;
  height: 25px;
`;
