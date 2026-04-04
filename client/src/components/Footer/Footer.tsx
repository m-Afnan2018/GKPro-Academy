import commonImages from "@/constants/commonImages";
import styles from "./Footer.module.css";
import Link from "next/link";

const companyLinks = [{ name: "Home", href: "/" }, { name: "About Us", href: "/about" }, { name: "Course", href: "/courses" }, { name: "Blog", href: "/blogs" }, { name: "Contact Us", href: "/contact" }];
const usefulLinks = ["CA Courses", "Skill Course"];

const MAP_EMBED_URL = "https://www.google.com/maps?q=30.7333,76.7794&output=embed";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* About */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>About Us</h4>
          <svg className={styles.waveSvg} width="50" height="8" viewBox="0 0 50 8" fill="none">
            <path d="M0 4 Q 6.25 0 12.5 4 T 25 4 T 37.5 4 T 50 4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
          </svg>
          <p className={styles.aboutText}>
            GKPro Academy is a professional learning platform focused on Chartered
            Accountancy preparation and practical accounting skill courses.
          </p>
        </div>

        {/* Company */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Company</h4>
          <svg className={styles.waveSvg} width="50" height="8" viewBox="0 0 50 8" fill="none">
            <path d="M0 4 Q 6.25 0 12.5 4 T 25 4 T 37.5 4 T 50 4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
          </svg>
          <ul className={styles.linkList}>
            {companyLinks.map((l) => (
              <li key={l.name}><Link href={l.href} className={styles.link}>{l.name}</Link></li>
            ))}
          </ul>
        </div>

        {/* Useful Links */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Useful Links</h4>
          <svg className={styles.waveSvg} width="50" height="8" viewBox="0 0 50 8" fill="none">
            <path d="M0 4 Q 6.25 0 12.5 4 T 25 4 T 37.5 4 T 50 4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
          </svg>
          <ul className={styles.linkList}>
            {usefulLinks.map((l) => (
              <li key={l}><Link href="#" className={styles.link}>{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Follow Us & Map */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Follow Us :</h4>
          <svg className={styles.waveSvg} width="50" height="8" viewBox="0 0 50 8" fill="none">
            <path d="M0 4 Q 6.25 0 12.5 4 T 25 4 T 37.5 4 T 50 4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
          </svg>

          <div className={styles.followWrap}>
            <div className={styles.followDetails}>
              <ul className={styles.contactList}>
                <li>
                  <span className={styles.labelRed}>Email:</span>
                  <a href="mailto:info@gkproacademy.com" className={styles.link}>info@gkproacademy.com</a>
                </li>
                <li>
                  <span className={styles.labelRed}>Phone:</span>
                  <a href="tel:+8427075296" className={styles.link}>+8427075296</a>
                </li>
                <li>
                  <span className={styles.labelRed}>Location:</span>
                  <span>Vishwa Karma Road, Doraha, Ludhiana, Punjab, India - 141421</span>
                </li>
              </ul>

              <div className={styles.socialsRow}>
                <span className={styles.followLabel}>Follow on:</span>
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
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" opacity="0.1" />
                    </>
                  },
                  {
                    label: "Instagram",
                    icon: <>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </>
                  }
                ].map((s) => (
                  <a key={s.label} href="#" className={styles.socialBtn} aria-label={s.label}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            <div className={styles.mapContainer}>
              <iframe
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}

                loading="lazy"
                title="GKPro Academy Location"
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomBarInner}`}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <img src={commonImages.logo.src} alt="logo" />
            </div>
          </div>
          <p className={styles.copyright}>Copyright &copy; 2026 edplus. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
