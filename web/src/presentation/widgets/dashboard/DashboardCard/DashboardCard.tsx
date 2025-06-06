import { Icon } from "@/presentation/ui/Icon";

import {
  CardContainer,
  CardInfoWrapper,
  CardTextWrapper,
  CardTitle,
  CardDescription,
} from "./DashboardCard.styled";

export interface DashboardCardProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  taskCount?: number;
  title?: string;
  description?: string;
}

export function DashboardCard({ ...props }: DashboardCardProps) {
  return (
    <CardContainer>
      <CardInfoWrapper>
        <Icon as={props.icon!} size="24px" />
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
