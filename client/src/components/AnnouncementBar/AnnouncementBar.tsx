"use client";
import { useEffect, useState } from "react";
import styles from "./AnnouncementBar.module.css";
import { Announcement } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/announcements?limit=10`)
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data?.announcements || [];
        setAnnouncements(list);
      })
      .catch(() => { });
    console.log(announcements);
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className={styles.bar}>
      <div className="container">
        <p className={styles.text} key={current._id}>
          {current.link ? (
            <a
              href={current.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {current.content}
            </a>
          ) : (
            <span className={styles.link}>{current.content}</span>
          )}
        </p>
      </div>
    </div>
  );
}
