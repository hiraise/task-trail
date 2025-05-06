import { useEffect, useState } from "react";

type DeviceType = "mobile" | "tablet" | "desktop";

export const useDevice = (): DeviceType => {
  const [device, setDevice] = useState<DeviceType>("desktop");

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;

      if (width <= 767) {
        setDevice("mobile");
      } else if (width <= 1024) {
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
