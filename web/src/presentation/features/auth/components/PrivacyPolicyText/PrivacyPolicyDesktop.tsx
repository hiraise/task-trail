import clsx from "clsx";
import Link from "next/link";

import { authTexts } from "@/shared/locales/auth";
import { interpolate } from "@/shared/utils/interpolate";

import styles from "./PrivacyPolicyDesktop.module.css";


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
