import type { Metadata } from "next";
import BlogsContent from "./BlogsContent";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read the latest articles, study tips, exam strategies, and career guidance from GKPro Academy. Stay updated on CA, IELTS, PTE, Spoken English, and professional development.",
  keywords: [
    "CA exam tips",
    "IELTS preparation tips",
    "PTE study guide",
    "Spoken English tips",
    "CA study plan",
    "ACCA exam guide",
    "finance career blog",
    "GKPro Academy blog",
    "commerce education blog",
  ],
  openGraph: {
    title: "Blog — GKPro Academy",
    description:
      "Expert articles on CA, IELTS, PTE, English Communication, and professional skills. Study tips, exam strategies, and career guidance.",
    url: "https://gkproacademy.com/blogs",
  },
};

export default function BlogsPage() {
  return <BlogsContent />;
}
