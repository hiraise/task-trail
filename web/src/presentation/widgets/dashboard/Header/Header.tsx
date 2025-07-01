"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

import { ASSETS } from "@/infrastructure/config/assets";
import { ROUTES } from "@/infrastructure/config/routes";
import { IconButton } from "@/presentation/ui/IconButton";
import {
  HeaderButtonsContainer,
  HeaderContainer,
  LogoContainer,
} from "./Header.styled";

export function DashboardHeader() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < 15) {
            setVisible(true); // always show at very top
          } else if (scrollY > lastScrollY.current + 10) {
            setVisible(false); // hide on scroll down
          } else if (scrollY < lastScrollY.current - 10) {
            setVisible(true); // show on small scroll up
          }
          lastScrollY.current = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <HeaderContainer $visible={visible}>
      <LogoContainer>
        <Image
          alt="Logo"
          src={ASSETS.logo.mobileSimple}
          fill
          style={{ objectFit: "contain" }}
          priority
          sizes="164px"
        />
      </LogoContainer>
      <HeaderButtonsContainer>
        <IconButton
          icon={ASSETS.icons.search}
          onClick={() => toast.success("Search")}
          aria-label="Search"
        />
        <IconButton
          icon={ASSETS.icons.profile}
          onClick={() => router.push(ROUTES.profile)}
          aria-label="Profile"
        />
      </HeaderButtonsContainer>
    </HeaderContainer>
  );
}
