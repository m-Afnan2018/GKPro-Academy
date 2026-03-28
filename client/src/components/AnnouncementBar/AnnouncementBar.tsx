"use client";
import { useEffect, useState } from "react";
import styles from "./AnnouncementBar.module.css";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function AnnouncementBar() {
  const [text, setText] = useState("Join Our Telegram Channel — Stay Updated");

  useEffect(() => {
    fetch(`${BASE}/announcements?limit=1`)
      .then((r) => r.json())
      .then((json) => {
        const first = json?.data?.announcements?.[0];
        if (first?.content) setText(first.content);
      })
      .catch(() => {});
  }, []);

  return (
    <div className={styles.bar}>
      <div className="container">
        <p className={styles.text}>
          <span className={styles.arrow}>→</span>
          {text}
        </p>
      </div>
    </div>
  );
}
