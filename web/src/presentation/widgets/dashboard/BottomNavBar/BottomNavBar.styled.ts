import Link from "next/link";
import styled, { css } from "styled-components";

import { hoverable } from "@/shared/utils/media";

const NavBar = styled.nav`
  position: fixed;
  left: 0;
  bottom: 0;
  height: var(--bottom-nav-height);
  width: 100vw;
  padding: 0 20px;
  background-color: var(--background);
  border-top: 1px solid #cbcbcb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 999;
`;

const NavItem = styled(Link)<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 38px;

  ${({ $active }) =>
    $active &&
    css`
      svg,
      span {
        color: var(--foreground);
      }
    `}
  ${hoverable(css`
    &:hover {
      cursor: pointer;

      svg,
      span {
        color: var(--foreground);
      }
    }
  `)};
`;

const Label = styled.span`
  font-size: 10px;
  font-weight: 500;
  letter-spacing: -0.24px;
  color: var(--txt-grey);
  text-align: center;
`;
export { NavBar, NavItem, Label };
