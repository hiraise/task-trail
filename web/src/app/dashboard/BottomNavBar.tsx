import Link from "next/link";
import Icon from "next/image";
import styled from "styled-components";

import { ASSETS } from "@/infrastructure/config/assets";
import { ROUTES } from "@/infrastructure/config/routes";
import { sharedTexts } from "@/shared/locales/sharedTexts";

const NavBar = styled.nav`
  position: fixed;
  left: 0;
  bottom: 0;
  height: 62px;
  width: 100vw;
  padding: 0 20px;
  background-color: var(--background);
  border-top: 1px solid #cbcbcb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 999;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 38px;
`;

const Label = styled.span`
  font-size: 10px;
  font-weight: 500;
  letter-spacing: -0.24px;
  color: var(--txt-grey);
  text-align: center;
`;

const navItems = [
  {
    href: ROUTES.projects,
    icon: ASSETS.icons.project,
    label: sharedTexts.projects,
  },
  {
    href: ROUTES.boards,
    icon: ASSETS.icons.board,
    label: sharedTexts.boards,
  },
  {
    href: ROUTES.tasks,
    icon: ASSETS.icons.task,
    label: sharedTexts.tasks,
  },
  {
    href: ROUTES.archive,
    icon: ASSETS.icons.archive,
    label: sharedTexts.archive,
  },
];

export default function BottomNavBar() {
  return (
    <NavBar>
      {navItems.map((item) => (
        <NavItem key={item.label}>
          <Link href={item.href} passHref />
          <Icon src={item.icon} alt={item.label} width={24} height={24} />
          <Label>{item.label}</Label>
        </NavItem>
      ))}
    </NavBar>
  );
}
