"use client";

import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

export default function MainPage() {
  // Logic is handled by useInitSession in AuthAndUserInitializer
  return <LoadingScreen />;
}
