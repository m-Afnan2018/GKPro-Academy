import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gkproacademy.com"),
  title: {
    default: "GKPro Academy — CA, IELTS, PTE & Professional Skill Courses",
    template: "%s | GKPro Academy",
  },
  description:
    "GKPro Academy offers expert-led courses in CA, CS, CMA, ACCA, CFA, CPA, IELTS, PTE, Spoken English, Business Communication, Public Speaking, and Soft Skills. Join 15,000+ students in Ludhiana, Punjab.",
  keywords: [
    "GKPro Academy",
    "CA coaching Ludhiana",
    "CA Foundation coaching",
    "CA Intermediate coaching",
    "CA Final coaching",
    "CS coaching Punjab",
    "CMA coaching",
    "ACCA coaching India",
    "CFA coaching",
    "CPA coaching",
    "IELTS coaching Ludhiana",
    "PTE coaching Punjab",
    "Pre-IELTS classes",
    "English Foundation course",
    "Spoken English classes",
    "Business Communication course",
    "Managerial Skills training",
    "Soft Skills training",
    "Public Speaking course",
    "Interview Preparation classes",
    "professional exam coaching Punjab",
    "online CA classes",
    "study abroad English",
    "language courses Ludhiana",
    "commerce coaching Punjab",
  ],
  authors: [{ name: "GKPro Academy" }],
  creator: "GKPro Academy",
  publisher: "GKPro Academy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gkproacademy.com",
    siteName: "GKPro Academy",
    title: "GKPro Academy — CA, IELTS, PTE & Professional Skill Courses",
    description:
      "Expert-led courses in CA, CS, CMA, ACCA, CFA, IELTS, PTE, Spoken English, and Soft Skills. Join 15,000+ students at GKPro Academy, Ludhiana, Punjab.",
    images: [
      {
        url: "/images/Banner.webp",
        width: 1200,
        height: 630,
        alt: "GKPro Academy — Professional Exam & Language Courses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GKPro Academy — CA, IELTS, PTE & Professional Skill Courses",
    description:
      "Expert-led courses in CA, CS, CMA, ACCA, CFA, IELTS, PTE, Spoken English, and Soft Skills. Join 15,000+ students at GKPro Academy.",
    images: ["/images/Banner.webp"],
  },
  category: "education",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sora.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
