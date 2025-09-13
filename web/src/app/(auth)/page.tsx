import styles from "./page.module.css";

import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { LoginDesktopPage, LoginMobilePage } from "@/presentation/pages/login";

export default function LoginPage() {
  // Temporary styles only for desktop page
  return (
    <DeviceBased
      desktop={
        <div className={styles.root}>
          <LoginDesktopPage />
        </div>
      }
      mobile={<LoginMobilePage />}
    />
  );
}
