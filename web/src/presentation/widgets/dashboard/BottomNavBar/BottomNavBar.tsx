import { usePathname } from "next/navigation";

import { Label, NavBar, NavItem } from "./BottomNavBar.styled";
import { Icon } from "@/presentation/ui/Icon";
import { navItems } from "./BottomNavBar.config";
import { normalize } from "@/shared/utils/formatters";

export function BottomNavBar() {
  const pathName = usePathname();

  return (
    <NavBar>
      {navItems.map((item) => {
        const isCurrent = normalize(pathName) === normalize(item.href);
        return (
          <NavItem key={item.label} href={item.href} $active={isCurrent}>
            <Icon as={item.icon} size="24px" />
            <Label>{item.label}</Label>
          </NavItem>
        );
      })}
    </NavBar>
  );
}
