"use client";

import styled from "styled-components";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";

import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import {
  DashboardCard,
  mockDashboardCardsData,
} from "@/presentation/widgets/dashboard/DashboardCard";

const SectionTitle = styled.h1`
  font-size: 34px;
  font-weight: 500;
  margin-top: 90px;
  margin-bottom: 24px;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 66px; /* Space for the bottom navigation bar + 4px*/
`;

const mainPageTexts = {
  title: "Организуй планы",
};

export default function DashboardPage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <SectionTitle>{mainPageTexts.title}</SectionTitle>
      <CardsContainer>
        {/* Example of rendering multiple DashboardCards */}
        {Array.from({ length: mockDashboardCardsData.length }).map(
          (_, index) => (
            <DashboardCard
              key={index}
              {...(mockDashboardCardsData[index] || {})}
            />
          )
        )}
      </CardsContainer>
      <BottomNavBar />
    </MainContainer>
  );
}
