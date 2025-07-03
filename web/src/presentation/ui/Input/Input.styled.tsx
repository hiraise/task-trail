import styled from "styled-components";

export const InputLabel = styled.label`
  font-size: 12px;
  font-weight: 400;
  vertical-align: middle;
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

export const StyledTextarea = styled(Input).attrs({ as: "textarea" })`
  resize: none;
  overflow-y: auto;
`;
