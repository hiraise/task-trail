import styled from "styled-components";

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 8px;
`;

const CardInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardTitle = styled.h3`
  font-size: 17px;
  font-weight: 500;
  line-height: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardDescription = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
`;

export {
  CardContainer,
  CardInfoWrapper,
  CardTextWrapper,
  CardTitle,
  CardDescription,
};
