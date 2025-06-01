import styled from "styled-components";

import Spinner from "./Spinner";

const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
`;

export default function LoadingScreen() {
  return (
    <Container>
      <Spinner />
    </Container>
  );
}
