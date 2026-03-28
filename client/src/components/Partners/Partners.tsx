import styles from "./Partners.module.css";

const logos = [
  { name: "HubSpot",        text: "HubSpot" },
  { name: "Trustpilot",     text: "★ Trustpilot" },
  { name: "Coursera",       text: "Coursera" },
  { name: "Udemy",          text: "Udemy" },
  { name: "British Council",text: "British Council" },
  { name: "HubSpot 2",      text: "HubSpot" },
];

export default function Partners() {
  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {/* Duplicate list for seamless loop */}
        {[...logos, ...logos].map((logo, i) => (
          <div key={`${logo.name}-${i}`} className={styles.logo}>
            {logo.text}
          </div>
        ))}
      </div>
    </section>
  );
}
