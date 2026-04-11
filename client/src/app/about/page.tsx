import type { Metadata } from "next";
import AnnouncementBar from "@/components/AnnouncementBar/AnnouncementBar";
import Navbar from "@/components/Navbar/Navbar";
import AboutHero from "@/components/AboutHero/AboutHero";
import WhyChooseUs from "@/components/WhyChooseUs/WhyChooseUs";
import AboutContent from "@/components/AboutContent/AboutContent";
import Stats from "@/components/Stats/Stats";
import HowItWorks from "@/components/HowItWorks/HowItWorks";
import Testimonials from "@/components/Testimonials/Testimonials";
import Team from "@/components/Team/Team";
import Partners from "@/components/Partners/Partners";
import Features from "@/components/Features/Features";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about GKPro Academy — our mission, expert faculty, and commitment to shaping successful careers in CA, IELTS, PTE, Spoken English, and professional skills. Based in Ludhiana, Punjab.",
  keywords: [
    "about GKPro Academy",
    "GKPro Academy faculty",
    "CA coaching institute Ludhiana",
    "professional skills institute Punjab",
  ],
  openGraph: {
    title: "About GKPro Academy",
    description:
      "Meet the team behind GKPro Academy — expert faculty delivering CA, IELTS, PTE, Spoken English, and professional skill courses in Ludhiana, Punjab.",
    url: "https://gkproacademy.com/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main style={{ overflow: 'hidden' }}>
        <AboutHero />
        <WhyChooseUs />
        <AboutContent />
        <Stats />
        <HowItWorks />
        <Testimonials />
        <Team />
        <Partners />
        <Features />
      </main>
      <Footer />
    </>
  );
}
