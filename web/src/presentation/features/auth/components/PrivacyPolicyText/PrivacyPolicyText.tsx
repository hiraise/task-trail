import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import { authTexts } from "@/shared/locales/auth";
import { interpolate } from "@/shared/utils/interpolate";

import styles from "./PrivacyPolicyText.module.css";

interface PrivacyPolicyProps {
  btnName: string;
}

export function PrivacyPolicyText({ btnName }: PrivacyPolicyProps) {
  return (
    <p>
      <span className={styles.privacyPolicy}>
        {interpolate(authTexts.privacyPolicy.text, { btnName: btnName })}
      </span>
      <Link to={authTexts.privacyPolicy.buttonLink}>
        <span className={clsx("caption-med", styles.link)}>
          {authTexts.privacyPolicy.buttonText}
        </span>
      </Link>
    </p>
  );
}
