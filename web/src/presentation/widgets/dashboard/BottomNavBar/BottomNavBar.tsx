import { usePathname } from "next/navigation";

import { Label, NavBar, NavItem } from "./BottomNavBar.styled";
import { Icon } from "@/presentation/ui/Icon";
import { navItems } from "./BottomNavBar.config";

export function BottomNavBar() {
  const pathName = usePathname();

  const normalize = (str: string) => str.replace(/\/+$/, "");

  return (
    <NavBar>
      {navItems.map((item) => {
        const isCurrent = normalize(pathName) === normalize(item.href);
        return (
          <NavItem key={item.label} href={item.href} $active={isCurrent}>
            <Icon as={item.icon} size="24px" inheritColor />
            <Label>{item.label}</Label>
          </NavItem>
        );
      })}
    </NavBar>
  );
}
