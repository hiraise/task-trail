import { ComponentType, SVGProps } from "react";

import { StyledMenuButton, StyledText } from "./MenuButton.styled";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface MenuButtonProps {
  href: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
}

export function MenuButton({
  href,
  icon = ICONS.rightArrow,
  text,
}: MenuButtonProps) {
  return (
    <StyledMenuButton href={href} className="menu-button">
      <StyledText>{text}</StyledText>
      <Icon as={icon}></Icon>
    </StyledMenuButton>
  );
}
