import clsx from "clsx";

import styles from "./FormLayout.module.css";
import type { FormLayout } from "./types";

export const formClassName = (layout: FormLayout): string =>
  layout === "inline" ? styles.inline : styles.page;

// In a card the labels are small and gray; on a separate page, as in the phone mockup
export const labelClassName = (layout: FormLayout): string =>
  layout === "inline" ? clsx("body-reg-2", styles.label) : "body-med";
