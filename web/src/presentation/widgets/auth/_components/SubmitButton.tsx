import styled, { css } from "styled-components";

type ButtonVariant = "primary" | "text";

const variantStyles = {
  primary: css`
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    background: var(--bg-primary-contrast);
    color: var(--text-primary-contrast);
    padding: 12px 16px;

    &:hover {
      opacity: 0.6;
    }
  `,

  text: css`
    display: flex;
    gap: 12px;
    align-items: center;
    background: transparent;
    color: var(--text-primary);
    padding: 8px;

    &:hover {
      opacity: 0.6;
    }
  `,
};

const BaseButton = styled.button<{ $variant?: ButtonVariant }>`
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
