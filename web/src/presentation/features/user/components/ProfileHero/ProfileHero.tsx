import type { User } from "@/domain/models/User";
import { getUserDisplayName } from "@/domain/models/User";
import { Icon, Spinner } from "@/presentation/shared";
import { useLogout } from "@/presentation/shared/hooks";
import { ASSETS } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileAvatar } from "./ProfileAvatar";
import styles from "./ProfileHero.module.css";

/**
 * Шапка профиля: обложка, аватарка, имя и почта. На телефоне на обложке заголовок, а выход —
 * внизу страницы (ProfilePage); с 768 px выход — кнопкой на обложке.
 */
export function ProfileHero({ user }: { user: User }) {
  const { mutate: logout, isPending: loading } = useLogout();

  return (
    <div className={styles.hero}>
      <div className={styles.cover}>
        <img className={styles.coverImage} src={ASSETS.images.hero} alt={TEXTS.profile.heroAlt} />
        <h4 className={styles.title}>{TEXTS.profile.title}</h4>
        <button
          type="button"
          onClick={() => logout()}
          className={styles.logoutButton}
          aria-label={TEXTS.profile.logoutFromAccount}
          disabled={loading}
        >
          {loading ? <Spinner size={24} /> : <Icon as={ICONS.leave} size="24px" inheritColor />}
        </button>
      </div>
      <ProfileAvatar user={user} className={styles.avatar}>
        <div className={styles.username}>
          <h3 className={styles.name}>{getUserDisplayName(user)}</h3>
          <span className={styles.email}>{user.email}</span>
        </div>
      </ProfileAvatar>
    </div>
  );
}
