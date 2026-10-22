import clsx from "clsx";

import styles from "./FormLayout.module.css";
import type { FormLayout } from "./types";

export const formClassName = (layout: FormLayout): string =>
  layout === "inline" ? styles.inline : styles.page;

// В карточке подписи мелкие и серые, на отдельной странице — как в макете телефона
export const labelClassName = (layout: FormLayout): string =>
  layout === "inline" ? clsx("body-reg-2", styles.label) : "body-med";
