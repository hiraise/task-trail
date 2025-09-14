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

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
