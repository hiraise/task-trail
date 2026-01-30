"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import type { User } from "@/domain/models/User";
import { ASSETS } from "@/shared/config/assets";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileAvatar } from "./ProfileAvatar";
import styles from "./ProfileHeroMobile.module.css";

export function ProfileHeroMobile({ user }: { user: User }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    // Calculate measurements
    let minTop = heroRef.current.getBoundingClientRect().top;
    let maxBottom = heroRef.current.getBoundingClientRect().bottom;

    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      minTop = Math.min(minTop, rect.top);
      maxBottom = Math.max(maxBottom, rect.bottom);
    }

    const newHeight = maxBottom - minTop;

    // Defer setState to avoid synchronous update in effect
    setTimeout(() => setHeight(newHeight), 0);
  }, [user]);

  return (
    <div ref={heroRef} style={{ minHeight: height }}>
      <div className={styles.container}>
        <Image src={ASSETS.images.hero} fill sizes="100vw" alt={TEXTS.profile.heroAlt} priority />
        <ProfileAvatar ref={avatarRef} user={user} className={styles.avatar} size="mobile">
          <div className={styles.username}>
            <h4>{user.username}</h4>
            <span className="body-reg-2">{user.email}</span>
          </div>
        </ProfileAvatar>
      </div>
    </div>
  );
}
