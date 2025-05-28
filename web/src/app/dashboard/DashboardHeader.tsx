"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styled from "styled-components";

import { ASSETS } from "@/infrastructure/config/assets";

const HeaderContainer = styled.header<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  padding: 0 20px;
  padding-top: 20px;
  padding-bottom: 40px;
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: top;
  z-index: 1000;
  border-bottom: 1px solid #cbcbcb;
  background: var(--background);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${({ $visible }) =>
    $visible ? "translateY(0)" : "translateY(-100%)"};
`;

const HeaderButtonsContainer = styled.div`
  display: flex;
  gap: 20px;
`;

const LogoContainer = styled.div`
  position: relative;
  width: 164px;
  height: 25px;
`;

export default function DashboardHeader() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

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
        <Image src={ASSETS.icons.search} alt="Search" width={28} height={28} />
        <Image
          src={ASSETS.icons.profile}
          alt="Profile"
          width={28}
          height={28}
        />
      </HeaderButtonsContainer>
    </HeaderContainer>
  );
}
