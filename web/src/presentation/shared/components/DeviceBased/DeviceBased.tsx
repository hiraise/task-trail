"use client";

import { useLayoutEffect, useState } from "react";

import { useDevice } from "../../hooks";

interface DeviceBasedProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  tablet?: React.ReactNode;
}

export function DeviceBased({ mobile, tablet, desktop }: DeviceBasedProps) {
  const [mounted, setMounted] = useState(false);
  const device = useDevice();

  useLayoutEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) return null;

  if (device === "mobile") return <>{mobile}</>;
  if (device === "tablet") return <>{tablet || desktop}</>;
  return <>{desktop}</>;
}
