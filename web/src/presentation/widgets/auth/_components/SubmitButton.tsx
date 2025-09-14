import styled, { css } from "styled-components";

type ButtonVariant = "primary";

const variantStyles = {
  primary: css`
    background: var(--bg-primary-contrast);
    color: var(--text-primary-contrast);

    &:hover {
      opacity: 0.6;
    }
  `,
};

const BaseButton = styled.button<{ $variant?: ButtonVariant }>`
  padding: 12px 16px;
  border: none;
  border-radius: 10000px;
  cursor: pointer;
  transition: opacity 0.3s;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &:disabled:hover {
    cursor: not-allowed;
  }

  ${({ $variant = "primary" }) => variantStyles[$variant]}
`;

export const SubmitButton = styled(BaseButton)``;
