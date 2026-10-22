import clsx from "clsx";

import styles from "./ProfileFormLayout.module.css";
import type { ProfileFormLayout } from "./types";

export const formClassName = (layout: ProfileFormLayout): string =>
  layout === "inline" ? styles.inline : styles.page;

// В карточке подписи мелкие и серые, на отдельной странице — как в макете телефона
export const labelClassName = (layout: ProfileFormLayout): string =>
  layout === "inline" ? clsx("body-reg-2", styles.label) : "body-med";
