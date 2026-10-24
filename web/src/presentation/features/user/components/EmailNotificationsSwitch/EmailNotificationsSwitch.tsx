import { CheckBox } from "@/presentation/shared/ui";
import { usePublicSettings } from "@/presentation/shared/hooks";
import { notificationsTexts } from "@/shared/locales/notifications";

import { useGetCurrentUser, useSetEmailNotifications } from "../../hooks";

import styles from "./EmailNotificationsSwitch.module.css";

/**
 * The profile switch of notification emails (ADR-0038). Without mail it still works: the choice
 * applies once the administrator connects mail, and the hint says emails do not go yet.
 */
export function EmailNotificationsSwitch() {
  const { data: user } = useGetCurrentUser();
  const { data: settings } = usePublicSettings();
  const { mutate: setEnabled, isPending, variables } = useSetEmailNotifications();

  if (!user) return null;

  // While saving, show the requested value
  const checked = isPending && variables !== undefined ? variables : user.emailNotifications;
  const toggle = () => {
    if (!isPending) setEnabled(!checked);
  };

  return (
    <div className={styles.switch}>
      <div className={styles.row}>
        <CheckBox
          checked={checked}
          onChange={toggle}
          aria-label={notificationsTexts.emailSwitch}
        />
        {/* CheckBox is not a native input, so a <label> would not forward the click */}
        <span className={styles.label} onClick={toggle} aria-hidden="true">
          {notificationsTexts.emailSwitch}
        </span>
      </div>
      <span className={styles.hint}>
        {settings?.mailEnabled === false ? notificationsTexts.mailDisabled : notificationsTexts.emailHint}
      </span>
    </div>
  );
}
