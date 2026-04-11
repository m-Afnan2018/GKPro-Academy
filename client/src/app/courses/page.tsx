import type { Metadata } from "next";
import CoursesContent from "./CoursesContent";

export const metadata: Metadata = {
  title: "All Courses",
  description:
    "Browse all courses at GKPro Academy — CA, CS, CMA, ACCA, CFA, CPA, IELTS, PTE, Spoken English, Business Communication, Public Speaking, Soft Skills, and more. Filter by category and find the right course for you.",
  keywords: [
    "CA courses",
    "IELTS courses",
    "PTE courses",
    "Spoken English courses",
    "Business Communication courses",
    "CA Foundation",
    "CA Intermediate",
    "CA Final",
    "CS coaching",
    "CMA coaching",
    "ACCA coaching",
    "CFA course",
    "CPA course",
    "Soft Skills training",
    "Public Speaking course",
    "Interview Preparation",
    "online courses Ludhiana",
  ],
  openGraph: {
    title: "All Courses — GKPro Academy",
    description:
      "Browse CA, IELTS, PTE, Spoken English, Business Communication, and professional exam courses. Expert faculty, live & recorded sessions.",
    url: "https://gkproacademy.com/courses",
  },
};

export default function CoursesPage() {
  return <CoursesContent />;
}
