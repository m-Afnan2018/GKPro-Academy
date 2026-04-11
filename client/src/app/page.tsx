import type { Metadata } from "next";
import AnnouncementBar from "@/components/AnnouncementBar/AnnouncementBar";
import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
import Categories from "@/components/Categories/Categories";
import Features from "@/components/Features/Features";
import About from "@/components/About/About";
import Stats from "@/components/Stats/Stats";
import Courses from "@/components/Courses/Courses";
import HowItWorks from "@/components/HowItWorks/HowItWorks";
import Testimonials from "@/components/Testimonials/Testimonials";
import Tutors from "@/components/Tutors/Tutors";
import Blog from "@/components/Blog/Blog";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "GKPro Academy — CA, IELTS, PTE & Professional Skill Courses",
  description:
    "GKPro Academy offers CA, CS, CMA, ACCA, CFA, CPA, IELTS, PTE, Spoken English, Business Communication, Public Speaking, and Soft Skills courses. Learn from expert faculty in Ludhiana, Punjab.",
  openGraph: {
    title: "GKPro Academy — Expert-Led CA, IELTS & Skill Courses",
    description:
      "Join 15,000+ students at GKPro Academy. CA coaching, IELTS, PTE, Spoken English, Business Communication, and professional exam courses in Ludhiana, Punjab.",
    url: "https://gkproacademy.com",
  },
};

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main style={{ overflow: 'hidden' }}>
        <Hero />
        {/*<Categories />*/}
        <Features />
        <About />
        <Stats />
        <Courses />
        <HowItWorks />
        <Testimonials />
        <Tutors />
        <Blog />
      </main>
      <Footer />
    </>
  );
}
