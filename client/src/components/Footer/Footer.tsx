import styles from "./Footer.module.css";

const companyLinks = ["About Us", "CA Courses", "GK Courses", "Our Faculty", "Student Results", "Contact Us"];
const usefulLinks = ["CA Foundation", "CA Intermediate", "CA Final", "CA Test Series", "Admission Process", "Fee Structure"];
const exploreLinks = ["Student Portal", "Live Classes", "Recorded Lectures", "Mock Tests", "Study Material", "FAQs"];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* About */}
        <div className={styles.col}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#D42B3A" />
              <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" opacity="0.9" />
              <path d="M8 12v6l8 4 8-4v-6" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
            </svg>
            <span className={styles.logoText}>GKPro</span>
          </div>
          <p className={styles.aboutText}>
            GKPro Academy is a professional learning platform focused on Chartered Accountancy
            preparation and practical accounting skill courses.
          </p>
        </div>

        {/* Company */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <ul className={styles.linkList}>
            {companyLinks.map((l) => (
              <li key={l}><a href="#" className={styles.link}>{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Useful Links */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Useful Links</h4>
          <ul className={styles.linkList}>
            {usefulLinks.map((l) => (
              <li key={l}><a href="#" className={styles.link}>{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Explore */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Explore</h4>
          <ul className={styles.linkList}>
            {exploreLinks.map((l) => (
              <li key={l}><a href="#" className={styles.link}>{l}</a></li>
            ))}
          </ul>
        </div>

        {/* Follow Us */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Follow Us :</h4>
          <ul className={styles.contactList}>
            <li>
              <span className={styles.contactIcon}>✉</span>
              <a href="mailto:info@gkproacademy.com" className={styles.link}>info@gkproacademy.com</a>
            </li>
            <li>
              <span className={styles.contactIcon}>📞</span>
              <a href="tel:+918437076296" className={styles.link}>+91(0)8437076296</a>
            </li>
            <li>
              <span className={styles.contactIcon}>📍</span>
              <span className={styles.link}>Ludhiana, Punjab, India - 141101</span>
            </li>
          </ul>
          <div className={styles.socials}>
            <span className={styles.followLabel}>Follow on</span>
            {[
              { label: "Facebook", icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
              {
                label: "LinkedIn",
                icon: <>
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </>
              },
              {
                label: "YouTube",
                icon: <>
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
                </>
              },
            ].map((s) => (
              <a key={s.label} href="#" className={styles.socialBtn} aria-label={s.label}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">{s.icon}</svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className="container">
          <p className={styles.copyright}>Copyright &copy; 2026 GKPro. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
