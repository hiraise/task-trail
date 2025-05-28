import { ASSETS } from "@/infrastructure/config/assets";
import Icon from "next/image";
import styled from "styled-components";

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 8px;
`;

export const mockDashboardCardsData: DashboardCardProps[] = [
  {
    icon: ASSETS.icons.board,
    taskCount: 22,
    title: "Разработка мобильного приложения",
    description:
      "Планирование, дизайн и разработка нового приложения для iOS и Android",
  },
  {
    icon: ASSETS.icons.project,
    taskCount: 12,
    title: "Планирование маркетинговой кампании",
    description: "Организация и запуск рекламной кампании для нового продукта",
  },
  {
    icon: ASSETS.icons.board,
    taskCount: 1,
    title: "Бюджет и финансы",
    description: "Планирование и контроль бюджета для текущих проектов",
  },
  {
    icon: ASSETS.icons.board,
    taskCount: 52,
    title: "Встречи и мероприятия",
    description: "Планирование и контроль бюджета для текущих проектов",
  },
];

interface DashboardCardProps {
  icon?: string;
  taskCount?: number;
  title?: string;
  description?: string;
}

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

export default function DashboardCard({ ...props }: DashboardCardProps) {
  return (
    <CardContainer>
      <CardInfoWrapper>
        <Icon
          src={props.icon || "icon error"} //TODO: add error handling for icon
          alt="Card Icon"
          width={24}
          height={24}
        />
        {/* //TODO: add pluralization for task count */}
        <span>{props.taskCount} задачи</span>
      </CardInfoWrapper>
      <CardTextWrapper>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardTextWrapper>
    </CardContainer>
  );
}
