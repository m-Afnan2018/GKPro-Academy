import styles from "./Team.module.css";

const members = [
  {
    name: "Gagandeep Singh",
    role: "Co-Founder & Director",
    img: "/images/GagandeepSingh.png",
    socials: ["facebook", "linkedin", "youtube"],
  },
  {
    name: "CA Kiranjeet Kaur",
    role: "Co-Founder & Managing Director",
    img: "/images/KiranjeetKaur.png",
    socials: ["facebook", "linkedin", "youtube"],
  },
];

const SocialIcon = ({ type }: { type: string }) => {
  if (type === "facebook")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  if (type === "linkedin")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
};

export default function Team() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.topRow}>
          <span className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)">
              <circle cx="12" cy="12" r="10" />
            </svg>
            INSTRUCTORS
          </span>
          <h2 className={styles.heading}>
            A Team Committed to{" "}
            <span className={styles.underline}>Your Recovery</span>
          </h2>
        </div>

        <div className={styles.grid}>
          {members.map((m) => (
            <div key={m.name} className={styles.card}>
              <div className={styles.imgWrap}>
                <img src={m.img} alt={m.name} className={styles.img} />
              </div>
              <div className={styles.socials}>
                {m.socials.map((s) => (
                  <a key={s} href="#" className={styles.socialBtn} aria-label={s}>
                    <SocialIcon type={s} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
