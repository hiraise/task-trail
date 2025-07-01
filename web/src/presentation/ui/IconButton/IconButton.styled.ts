import styled, { css } from "styled-components";

import { hoverable } from "@/shared/utils/media";
import { IconButtonVariant } from "./IconButton.types";

const variantStyles = {
  primary: css`
    color: var(--icon-grey);
    ${hoverable(css`
      &:hover {
        color: var(--foreground);
        cursor: pointer;
      }
    `)};
  `,
  ghost: css`
    color: var(--background);
    ${hoverable(css`
      &:hover {
        color: var(--icon-grey);
        cursor: pointer;
      }
    `)}
  `,

  danger: css`
    color: var(--background);
    ${hoverable(css`
      &:hover {
        color: #e81818;
        cursor: pointer;
      }
    `)}
  `,
};

export const StyledButton = styled.button<{ $variant?: IconButtonVariant }>`
  all: unset;
  transition: background-color 0.2s;
  ${({ $variant = "primary" }) => variantStyles[$variant]}

  ${({ disabled }) =>
    disabled &&
    css`
      cursor: not-allowed;
      opacity: 0.4;
      pointer-events: none;
    `}
`;
