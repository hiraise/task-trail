import styled from "styled-components";

export const DesktopWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DesktopCard = styled.div`
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
`;

export const Title = styled.h1`
  margin-bottom: 24px;
  text-align: center;
  font-size: 24px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

export const Input = styled.input`
  padding: 12px;
  background-color: var(--grey);
  border: none;
  border-radius: 8px;

  &:focus {
    outline: none;
  }
  &:-webkit-autofill {
    background-color: var(--grey) !important;
    -webkit-box-shadow: 0 0 0px 1000px var(--grey) inset;
    color: inherit;
  }
  &:-moz-autofill {
    background-color: var(--grey) !important;
    box-shadow: 0 0 0px 1000px var(--grey) inset;
    color: inherit;
  }
`;

export const InputLabel = styled.label`
  font-size: 12px;
  font-weight: 400;
  vertical-align: middle;
`;

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
