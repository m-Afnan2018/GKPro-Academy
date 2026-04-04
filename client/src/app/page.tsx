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

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main style={{ overflow: 'hidden' }}>
        <Hero />
        <Categories />
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
