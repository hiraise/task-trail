"use client";

import { useLayoutEffect, useState } from "react";

import { useDevice } from "@/shared/hooks/useDevice";

interface DeviceBasedProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  tablet?: React.ReactNode;
}

export const DeviceBased = ({ mobile, tablet, desktop }: DeviceBasedProps) => {
  const [mounted, setMounted] = useState(false);
  const device = useDevice();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (device === "mobile") return <>{mobile}</>;
  if (device === "tablet") return <>{tablet || desktop}</>;
  return <>{desktop}</>;
};
