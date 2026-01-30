"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import type { User } from "@/domain/models/User";
import { useLogout } from "@/presentation/features/auth/hooks";
import { Icon, Spinner } from "@/presentation/shared";
import { ASSETS } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileAvatar } from "./ProfileAvatar";
import styles from "./ProfileHeroDesktop.module.css";

export function ProfileHeroDesktop({ user }: { user: User }) {
  const { mutateAsync: logout, isPending: loading } = useLogout();
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

    setTimeout(() => setHeight(maxBottom - minTop), 0);
  }, [user]);

  return (
    <div ref={heroRef} style={{ minHeight: height }}>
      <div className={styles.container}>
        <Image src={ASSETS.images.hero} fill sizes="100vw" alt={TEXTS.profile.heroAlt} priority />
        <button onClick={() => logout()} className={styles.logoutButton}>
          {loading ? <Spinner size={24} /> : <Icon as={ICONS.leave} size="24px" inheritColor />}
        </button>
        <ProfileAvatar ref={avatarRef} user={user} className={styles.avatar}>
          <div className={styles.username}>
            <h3>{user.username}</h3>
            <span className="body-reg">{user.email}</span>
          </div>
        </ProfileAvatar>
      </div>
    </div>
  );
}
