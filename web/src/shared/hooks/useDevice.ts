import { useEffect, useState } from "react";

type DeviceType = "mobile" | "tablet" | "desktop";

const breakpoints: Record<string, number> = {
  mobile: 767,
  tablet: 1024,
};

export const useDevice = (): DeviceType => {
  const [device, setDevice] = useState<DeviceType>("desktop");

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;

      if (width <= breakpoints.mobile) {
        setDevice("mobile");
      } else if (width <= breakpoints.tablet) {
        setDevice("tablet");
      } else {
        setDevice("desktop");
      }
    };

    detectDevice(); // check device on initial load
    window.addEventListener("resize", detectDevice); // check device on resize
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  return device;
};
