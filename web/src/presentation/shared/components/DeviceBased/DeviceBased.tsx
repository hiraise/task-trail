import { useDevice } from "../../hooks";

interface DeviceBasedProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  tablet?: React.ReactNode;
}

// Renders the device variant at once, without an empty first frame: useDevice knows the device type
// from the first render. Do not add new usages: one adaptive screen (ADR-0008).
export function DeviceBased({ mobile, tablet, desktop }: DeviceBasedProps) {
  const device = useDevice();

  if (device === "mobile") return <>{mobile}</>;
  if (device === "tablet") return <>{tablet || desktop}</>;

  return <>{desktop}</>;
}
