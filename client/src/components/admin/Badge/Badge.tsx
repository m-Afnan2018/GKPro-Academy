import styles from "./Badge.module.css";

type Variant = "green" | "red" | "yellow" | "blue" | "gray";

interface Props {
  children: React.ReactNode;
  variant?: Variant;
}

export default function Badge({ children, variant = "gray" }: Props) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
}
