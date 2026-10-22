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

// Тип устройства известен уже в первом кадре: иначе экран сначала рисуется как на десктопе
// или пустым, а потом перерисовывается — это видно как моргание.
export const useDevice = (): DeviceType => {
  const [device, setDevice] = useState<DeviceType>(() => getDeviceType(window.innerWidth));

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
