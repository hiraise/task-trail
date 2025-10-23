import Link from "next/link";
import clsx from "clsx";

import styles from "./PrivacyPolicyDesktop.module.css";

import { interpolate } from "@/shared/utils/interpolate";
import { authTexts } from "@/shared/locales/auth";

interface PrivacyPolicyProps {
  btnName: string;
}

export function PrivacyPolicyDesktop({ btnName }: PrivacyPolicyProps) {
  return (
    <p>
      <span className={styles.privacyPolicy}>
        {interpolate(authTexts.privacyPolicy.text, { btnName: btnName })}
      </span>
      <Link href={authTexts.privacyPolicy.buttonLink}>
        <span className={clsx("caption-med", styles.link)}>
          {authTexts.privacyPolicy.buttonText}
        </span>
      </Link>
    </p>
  );
}
