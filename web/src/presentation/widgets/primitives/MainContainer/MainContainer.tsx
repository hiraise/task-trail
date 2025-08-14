import styles from "./styles.module.css";

export function MainContainer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={styles.main}>{children}</div>;
}

MainContainer.displayName = "MainContainer";
