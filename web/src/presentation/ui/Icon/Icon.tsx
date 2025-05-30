import { StyledSvg } from "./Icon.styled";

interface IconProps extends React.SVGAttributes<SVGElement> {
  as: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: string;
  color?: string;
  inheritColor?: boolean;
}

/**
 * Renders a styled SVG icon component using a provided SVG React component.
 *
 * @param as - The SVG React component to render as the icon.
 * @param size - Optional size of the icon (e.g., "24px", "2em").
 * @param color - Optional color of the icon.
 * @param inheritColor - If true, the icon inherits the color from its parent.
 * @param rest - Additional SVG attributes to pass to the icon.
 * @returns The rendered SVG icon component, or null if `as` is not provided.
 */

export function Icon({ as, color, size, inheritColor, ...rest }: IconProps) {
  //TODO: handle case where `as` is not a valid SVG element
  if (!as) return null;
  return (
    <StyledSvg
      as={as}
      className="StyledSvg"
      $color={color}
      $size={size}
      $inheritColor={inheritColor}
      {...rest}
    />
  );
}
