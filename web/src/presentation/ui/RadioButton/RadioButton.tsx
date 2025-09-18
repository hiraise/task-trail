import styles from "./RadioButton.module.css";

type RadioButtonOption = {
  value: string;
  label: string;
};

export function RadioButton<T extends RadioButtonOption>({
  option,
  ...rest
}: { option: T } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.option}>
      <span className="btn-font-m">{option.label}</span>
      <input type="radio" className={styles.radio} value={option.value} {...rest} />
    </label>
  );
}
