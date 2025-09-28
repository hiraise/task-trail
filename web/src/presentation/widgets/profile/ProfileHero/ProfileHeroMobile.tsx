"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

import styles from "./ProfileHeroMobile.module.css";

import { ASSETS } from "@/infrastructure/config/assets";
import { User } from "@/domain/user/user.entity";
import { ProfileAvatar } from "./ProfileAvatar";
import { TEXTS } from "@/shared/locales/texts";
import { getDisplayName } from "@/shared/utils/getDisplayName";

export function ProfileHeroMobile({ user }: { user: User }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    let minTop = heroRef.current.getBoundingClientRect().top;
    let maxBottom = heroRef.current.getBoundingClientRect().bottom;

    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      minTop = Math.min(minTop, rect.top);
      maxBottom = Math.max(maxBottom, rect.bottom);
    }

    setHeight(maxBottom - minTop);
  }, [user]);

  return (
    <div ref={heroRef} style={{ minHeight: height }}>
      <div className={styles.container}>
        <Image src={ASSETS.images.hero} fill sizes="100vw" alt={TEXTS.profile.heroAlt} priority />
        <ProfileAvatar ref={avatarRef} user={user} className={styles.avatar} size="mobile">
          <div className={styles.username}>
            <h4>{getDisplayName(user)}</h4>
            <span className="body-reg-2">{user.email}</span>
          </div>
        </ProfileAvatar>
      </div>
    </div>
  );
}
