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

// The device type is known already in the first frame: otherwise the screen is first drawn as on a desktop
// or empty and then redrawn, which shows as a flicker.
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
