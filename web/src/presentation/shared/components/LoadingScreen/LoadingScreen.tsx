import { Spinner } from "../../ui";

import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <Spinner />
    </div>
  );
}
