import { Spinner } from "@/presentation/ui/Spinner";
import styles from "./LoadingScreen.module.css";

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      <Spinner />
    </div>
  );
}
