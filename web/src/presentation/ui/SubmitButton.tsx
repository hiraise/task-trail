import styled, { css } from "styled-components";

type ButtonVariant = "primary" | "secondary" | "text";

const variantStyles = {
  primary: css`
    background: var(--btn-primary);
    color: var(--background);

    &:hover {
      background: var(--grey);
      color: var(--foreground);
    }
  `,
  secondary: css`
    background: rgba(243, 243, 243, 1);
  `,
  text: css`
    background: transparent;
    color: var(--btn-primary);

    &:hover {
      text-decoration: underline;
    }
  `,
};

const BaseButton = styled.button<{ $variant?: ButtonVariant }>`
  padding: 12px 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    pointer-events: none;
    cursor: default;
    opacity: 0.6;
  }

  &:active:disabled {
    transform: none;
  }

  ${({ $variant = "primary" }) => variantStyles[$variant]}
`;

export const SubmitButton = styled(BaseButton)``;
