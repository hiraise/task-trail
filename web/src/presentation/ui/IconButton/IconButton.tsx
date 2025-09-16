import { Icon } from "../Icon";

import { StyledButton } from "./IconButton.styled";
import { IconButtonProps } from "./IconButton.types";

/**
 * Renders a button containing an icon, supporting multiple visual variants and accessibility features.
 *
 * @param icon - The SVG icon component to display inside the button.
 * @param variant - The visual style of the button. Can be `"primary"`, `"ghost"`, or `"danger"`. Defaults to `"primary"`.
 * @param size - The size of the icon, passed to the `Icon` component.
 * @param rest - Additional props forwarded to the underlying `<button>` element.
 *
 * @returns A styled button element containing the specified icon, with variant-based styling and accessibility support.
 */

export function IconButton({ icon, variant, size = "24px", ...rest }: IconButtonProps) {
  return (
    <StyledButton $variant={variant} {...rest}>
      <Icon as={icon} size={size} inheritColor />
    </StyledButton>
  );
}
