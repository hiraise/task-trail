import styled, { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  .StyledSvg {
    color: var(--icon-grey, #888);
  }
`;

export const StyledSvg = styled.svg<{
  $size?: string;
  $color?: string;
  $inheritColor?: boolean;
}>`
  ${({ $size }) =>
    $size &&
    `
    width: ${$size};
    height: ${$size};
  `}

  color: ${({ $inheritColor, $color }) =>
    $inheritColor ? "inherit" : $color ?? "var(--icon-grey)"};

  display: inline-block;
  vertical-align: middle;
  transition: color 0.2s ease;
`;
