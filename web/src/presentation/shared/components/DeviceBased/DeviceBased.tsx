import { useDevice } from "../../hooks";

interface DeviceBasedProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  tablet?: React.ReactNode;
}

// Рисует вариант для устройства сразу, без пустого первого кадра: тип устройства useDevice
// знает с первого рендера. Новых использований не добавляй — один адаптивный экран (ADR-0008).
export function DeviceBased({ mobile, tablet, desktop }: DeviceBasedProps) {
  const device = useDevice();

  if (device === "mobile") return <>{mobile}</>;
  if (device === "tablet") return <>{tablet || desktop}</>;

  return <>{desktop}</>;
}
