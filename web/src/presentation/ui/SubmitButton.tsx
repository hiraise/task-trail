import styled from "styled-components";

export const SubmitButton = styled.button`
  padding: 12px 10px;
  background: var(--btn-primary);
  color: var(--background);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: var(--grey);
    color: var(--foreground);
  }
  &:active {
    transform: scale(0.98);
  }
`;
