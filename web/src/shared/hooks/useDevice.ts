import { useEffect, useState } from "react";

type DeviceType = "mobile" | "tablet" | "desktop";

const BREAKPOINTS: Record<DeviceType, number> = {
  mobile: 767,
  tablet: 1024,
  desktop: Infinity, // No upper limit for desktop
};

const getDeviceType = (width: number): DeviceType => {
  if (width <= BREAKPOINTS.mobile) return "mobile";
  if (width <= BREAKPOINTS.tablet) return "tablet";
  return "desktop";
};

export const useDevice = (): DeviceType | null => {
  const [device, setDevice] = useState<DeviceType | null>(null);

  useEffect(() => {
    const detectDevice = () => {
      const currentType = getDeviceType(window.innerWidth);
      setDevice((prev) => (prev !== currentType ? currentType : prev));
    };

    detectDevice();
    window.addEventListener("resize", detectDevice);

    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  return device;
};
