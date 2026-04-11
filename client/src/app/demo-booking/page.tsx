import type { Metadata } from "next";
import DemoBookingContent from "./DemoBookingContent";

export const metadata: Metadata = {
  title: "Book a Free Demo Class",
  description:
    "Experience GKPro Academy before you enroll. Book a free demo class with our expert faculty for CA, CS, CMA, IELTS, PTE, Spoken English, or any of our courses. No commitments — just great learning.",
  keywords: [
    "free demo class GKPro",
    "CA demo class Ludhiana",
    "IELTS demo class",
    "free trial class coaching",
    "book demo session GKPro Academy",
  ],
  openGraph: {
    title: "Book a Free Demo Class — GKPro Academy",
    description:
      "Attend a live demo session with GKPro Academy's expert faculty. Free, no commitment. Available for CA, IELTS, PTE, Spoken English, and more.",
    url: "https://gkproacademy.com/demo-booking",
  },
};

export default function DemoBookingPage() {
  return <DemoBookingContent />;
}
