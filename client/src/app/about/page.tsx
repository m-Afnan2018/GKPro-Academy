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
  title: "About Us — GKPro Academy",
  description:
    "Learn about GKPro Academy — our mission, vision, expert faculty, and commitment to shaping successful CA and accounting careers.",
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
