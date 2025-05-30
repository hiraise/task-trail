import { css } from "styled-components";

export const hoverable = (hoverStyles: ReturnType<typeof css>) => css`
  @media (hover: hover) and (pointer: fine) {
    ${hoverStyles}
  }
`;
