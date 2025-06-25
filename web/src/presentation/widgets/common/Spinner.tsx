import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div<{ size?: number }>`
  width: ${({ size }) => size || 40}px;
  height: ${({ size }) => size || 40}px;
  border: 4px solid var(--grey);
  border-top: 4px solid var(--foreground);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  align-self: center;
  justify-self: center;
`;

export default Spinner;
