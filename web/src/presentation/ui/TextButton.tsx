import styled from "styled-components";

export const TextButton = styled.button.attrs({ type: "button" })<{
  $weight?: number;
}>`
  font-weight: ${(props) => props.$weight || 400};
  display: block;
  text-align: right;
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
`;
