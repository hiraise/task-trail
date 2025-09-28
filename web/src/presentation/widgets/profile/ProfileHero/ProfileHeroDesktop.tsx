"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

import styles from "./ProfileHeroDesktop.module.css";

import { ASSETS } from "@/infrastructure/config/assets";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { User } from "@/domain/user/user.entity";
import { ProfileAvatar } from "./ProfileAvatar";
import { useLogout } from "@/application/auth/hooks/useLogout";
import { Spinner } from "@/presentation/ui/Spinner";
import { TEXTS } from "@/shared/locales/texts";
import { getDisplayName } from "@/shared/utils/getDisplayName";

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

    setHeight(maxBottom - minTop);
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
            <h3>{getDisplayName(user)}</h3>
            <span className="body-reg">{user.email}</span>
          </div>
        </ProfileAvatar>
      </div>
    </div>
  );
}
