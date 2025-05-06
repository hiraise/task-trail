"use client";

import { LoginFormMobile } from "./LoginFormMobile";
import { LoginFormDesktop } from "./LoginFormDesktop";
import { DeviceBased } from "@/presentation/ui/DeviceBased";

export const LoginForm = () => {
  return (
    <DeviceBased
      mobile={<LoginFormMobile />}
      desktop={<LoginFormDesktop />}
    ></DeviceBased>
  );
};
