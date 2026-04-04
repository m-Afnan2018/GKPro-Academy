/**
 * Seed script — adds demo blogs for the academy.
 * Run: node src/scripts/seed-blogs.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gkpro";

const Blog = require("../models/Blog");
const User = require("../models/User");

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✔  Connected to MongoDB:", MONGO_URI);

  // Find Admin User for authorId
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    const bcrypt = require("bcryptjs");
    admin = await User.create({
      name: "GKPro Admin",
      email: "admin@gkpro.com",
      phone: "9876543210",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "admin",
      isActive: true,
    });
    console.log("✔  Created fallback admin user");
  }

  const blogsData = [
    {
      title: "Top 5 Tips to Crack CA Foundation on Your First Attempt",
      content: `<p>The CA Foundation exam is the first step towards your Chartered Accountancy dream. Many students struggle with the transition from high school to professional exams. Here are five golden rules to ensure you clear it seamlessly:</p>
      <ol>
        <li><strong>Understand the Syllabus:</strong> Don't just read; decode the weightage of each chapter.</li>
        <li><strong>Consistent Revision:</strong> Spaced repetition is the key to retaining vast amounts of information like Business Laws.</li>
        <li><strong>Mock Tests are Mandatory:</strong> They help you understand your speed, accuracy, and time management.</li>
        <li><strong>Focus on Conceptual Clarity:</strong> Rote learning doesn't work for Accounting or Quantitative Aptitude.</li>
        <li><strong>Stay Healthy and Positive:</strong> Your mental health plays a massive role in your performance.</li>
      </ol>
      <p>Start your preparation with GKPro Academy's comprehensive Foundation program today!</p>`,
      imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
      authorId: admin._id,
      isPublished: true,
      approvalStatus: "approved",
      approvedBy: admin._id,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title: "Understanding the New Tax Regime: Impacts & Opportunities",
      content: `<p>The recent Union budget has introduced significant shifts in the tax slabs under the new regime. For CA Intermediate and Final students, staying updated with these changes is not just about general knowledge; it's a critical part of the Taxation syllabus.</p>
      <h3>Key Changes To Note:</h3>
      <ul>
        <li>The basic exemption limit variations and rebate under Section 87A.</li>
        <li>Standard deduction implications for salaried taxpayers.</li>
        <li>Changes in surcharge rates for high net-worth individuals.</li>
      </ul>
      <p>As a future CA, understanding these nuances allows you to provide better advisory services. Our Direct Tax course faculty, CA Rajesh Sharma, has prepared a detailed breakdown of these amendments in our latest lectures. Stay tuned!</p>`,
      imageUrl: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=800&auto=format&fit=crop",
      authorId: admin._id,
      isPublished: true,
      approvalStatus: "approved",
      approvedBy: admin._id,
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
    {
      title: "Time Management Strategies for CA Intermediate",
      content: `<p>Balancing eight intense subjects across two groups in CA Intermediate requires more than just hard work—it requires extreme discipline and strategy.</p>
      <p>Many students make the mistake of leaving revision to the last month. The ideal strategy involves the <strong>3-Revision Rule</strong>:</p>
      <blockquote>"First revision right after the topic is taught, second revision at the end of the month, and a comprehensive third revision before the mock exams."</blockquote>
      <p>Here are some practical tools:</p>
      <ul>
        <li>Use the Pomodoro technique (50 mins study, 10 mins break).</li>
        <li>Always create a weekly tracker for topics completed.</li>
        <li>Dedicate at least 2 hours daily for practical subjects like Advanced Accounting.</li>
      </ul>`,
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop",
      authorId: admin._id,
      isPublished: true,
      approvalStatus: "approved",
      approvedBy: admin._id,
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      title: "Life After Qualifying as a Chartered Accountant",
      content: `<p>The journey to the prefix 'CA' is undeniably grueling, but the rewards on the other side are immense. What exactly happens after you pass your CA Final exams?</p>
      <p>Opportunities open up across various domains:</p>
      <ul>
        <li><strong>Big 4 Consulting:</strong> Audit, Tax, and Advisory roles in leading multinational firms.</li>
        <li><strong>Investment Banking:</strong> Mergers & Acquisitions, Valuations, and Equity Research.</li>
        <li><strong>Entrepreneurship:</strong> Starting your own CA practice to advise thriving startups and businesses.</li>
        <li><strong>Industry Roles:</strong> Leading finance teams as a CFO or Financial Controller.</li>
      </ul>
      <p>The respect, financial stability, and continuous learning curve make the five years of hard work entirely worth it. Keep pushing forward!</p>`,
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
      authorId: admin._id,
      isPublished: true,
      approvalStatus: "approved",
      approvedBy: admin._id,
      publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    }
  ];

  for (const b of blogsData) {
    const slug = require("slugify")(b.title, { lower: true, strict: true });
    const existing = await Blog.findOne({ slug });
    if (existing) {
      console.log(`–  Blog already exists: ${b.title}`);
      continue;
    }
    
    await Blog.create(b);
    console.log(`✔  Created Blog: ${b.title}`);
  }

  console.log("\\n✅  Blog Seed complete.");
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
