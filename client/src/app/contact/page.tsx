import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with GKPro Academy. Reach us at Vishwa Karma Road, Doraha, Ludhiana, Punjab — or send us a message online. We're here to answer your questions about CA, IELTS, PTE, and all our courses.",
  keywords: [
    "contact GKPro Academy",
    "GKPro Academy address",
    "coaching institute contact Ludhiana",
    "CA coaching enquiry",
    "IELTS coaching enquiry",
  ],
  openGraph: {
    title: "Contact Us — GKPro Academy",
    description:
      "Reach GKPro Academy at Vishwa Karma Road, Doraha, Ludhiana, Punjab. Contact us for course enquiries about CA, IELTS, PTE, Spoken English, and more.",
    url: "https://gkproacademy.com/contact",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
