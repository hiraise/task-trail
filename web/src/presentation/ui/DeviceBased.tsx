import { useDevice } from "@/shared/hooks/useDevice";
import { ReactNode } from "react";

interface DeviceBasedProps {
  mobile: ReactNode;
  desktop: ReactNode;
  tablet?: ReactNode;
}

export const DeviceBased = ({ mobile, tablet, desktop }: DeviceBasedProps) => {
  const device = useDevice();

  if (device === "mobile") return <>{mobile}</>;
  if (device === "tablet") return <>{tablet || desktop}</>;
  return <>{desktop}</>;
};
