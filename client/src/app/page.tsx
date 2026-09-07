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
  title: "GKPro Academy — Online CA Coaching",
  description:
    "GKPro Academy offers expert-led online CA (Chartered Accountancy) coaching. Learn from experienced faculty and join thousands of successful students, from anywhere.",
  openGraph: {
    title: "GKPro Academy — Expert-Led Online CA Coaching",
    description:
      "Join 15,000+ students at GKPro Academy. Expert online CA coaching from anywhere in India.",
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
