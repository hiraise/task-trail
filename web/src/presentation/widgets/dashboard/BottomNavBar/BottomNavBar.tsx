import Link from "next/link";

import { forwardRef } from "react";

import { Label, NavBar, NavItem } from "./BottomNavBar.styled";
import { Icon } from "@/presentation/ui/Icon";
import { navItems } from "./BottomNavBar.config";

export const BottomNavBar = forwardRef<HTMLElement, object>(
  function BottomNavBar(props, ref) {
    return (
      <NavBar ref={ref}>
        {navItems.map((item) => (
          <NavItem key={item.label}>
            <Link href={item.href} passHref />
            <Icon as={item.icon} size="24px" />
            <Label>{item.label}</Label>
          </NavItem>
        ))}
      </NavBar>
    );
  }
);
