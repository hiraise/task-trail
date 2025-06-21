import styled from "styled-components";

const MainContainer = styled.main.withConfig({
  displayName: "MainContainer",
})`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  min-height: 100vh;
`;

export default MainContainer;
