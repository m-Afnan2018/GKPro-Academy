import styles from "./StatsCard.module.css";

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "red" | "green" | "blue" | "yellow";
  sub?: string;
}

export default function StatsCard({ label, value, icon, color = "red", sub }: Props) {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles[color]}`}>{icon}</div>
      <div className={styles.info}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
    </div>
  );
}
