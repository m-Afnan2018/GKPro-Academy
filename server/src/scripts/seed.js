/**
 * Seed script — adds demo categories, subcategories, faculty and courses.
 * Run: node src/scripts/seed.js
 * Safe to re-run: skips records that already exist by slug.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/gkpro";

/* ── models ─────────────────────────────────────── */
const CourseCategory = require("../models/CourseCategory");
const CourseSubcategory = require("../models/CourseSubcategory");
const Faculty = require("../models/Faculty");
const Course = require("../models/Course");
const User = require("../models/User");

/* ── helpers ─────────────────────────────────────── */
async function upsert(Model, filter, data) {
    const existing = await Model.findOne(filter);
    if (existing) return existing;
    return Model.create(data);
}

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log("✔  Connected to MongoDB:", MONGO_URI);

    /* ── Admin user (seed owner) ─────────────────────── */
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
        console.log("✔  Admin user created  →  admin@gkpro.com  /  Admin@123");
    } else {
        console.log("–  Admin user already exists, skipping.");
    }

    /* ── Categories ──────────────────────────────────── */
    const catData = [
        {
            name: "CA Foundation",
            slug: "ca-foundation",
            sortOrder: 1,
            description:
                "The CA Foundation course is the first and most important step for students who aspire to become Chartered Accountants. It lays the academic foundation required to build a successful career in accounting, finance, taxation, and business advisory.\n\nDesigned according to the latest syllabus prescribed by the Institute of Chartered Accountants of India (ICAI), this course ensures that students develop strong conceptual clarity and practical problem-solving skills from the very beginning of their CA journey.\n\nThis level focuses on strengthening core fundamentals across essential commerce and business subjects. Students gain in-depth knowledge of Accounting principles, Business Laws, Business Economics, and Quantitative Aptitude.\n\nThe CA Foundation course is suitable for both commerce and non-commerce students. Even if you are new to accounting or finance, the course starts from basics and gradually progresses to advanced topics with expert guidance.\n\nBy completing the CA Foundation course successfully, students take their first major step toward becoming a Chartered Accountant and unlocking career opportunities in top accounting firms, multinational companies, consulting organisations, and financial institutions.",
        },
        {
            name: "CA Intermediate",
            slug: "ca-intermediate",
            sortOrder: 2,
            description:
                "CA Intermediate is the second level of the Chartered Accountancy programme and covers advanced topics in accounting, taxation, auditing, and financial management.\n\nStudents who clear CA Foundation and register for Intermediate are required to complete nine months of study before appearing for the exams. This level is split into two groups, each containing four papers of rigorous academic depth.\n\nGKPro Academy's CA Intermediate programme offers comprehensive video lectures, study material, mock tests, and live doubt-solving sessions to help students master each paper confidently.\n\nOur experienced faculty breaks down complex concepts into easy-to-understand modules, ensuring exam-ready preparation from the very first lecture.",
        },
        {
            name: "CA Final",
            slug: "ca-final",
            sortOrder: 3,
            description:
                "CA Final is the last and most advanced level of the CA course. Clearing this exam qualifies a student as a Chartered Accountant — one of the most prestigious professional designations in India.\n\nThe CA Final syllabus covers Financial Reporting, Strategic Financial Management, Advanced Auditing, Direct and Indirect Tax Laws, and more. These subjects require deep understanding and extensive practice.\n\nGKPro Academy's CA Final courses are designed by highly experienced Chartered Accountants and subject matter experts who have guided thousands of students to success over the years.",
        },
    ];

    const cats = {};
    for (const d of catData) {
        const cat = await upsert(CourseCategory, { slug: d.slug }, d);
        cats[d.slug] = cat;
        console.log(`✔  Category: ${cat.name}`);
    }

    /* ── Subcategories ───────────────────────────────── */
    const subcatData = [
        /* CA Foundation */
        { name: "Accounting", slug: "foundation-accounting", categoryId: cats["ca-foundation"]._id, sortOrder: 1 },
        { name: "Business Laws", slug: "foundation-business-laws", categoryId: cats["ca-foundation"]._id, sortOrder: 2 },
        { name: "Business Economics", slug: "foundation-economics", categoryId: cats["ca-foundation"]._id, sortOrder: 3 },
        { name: "Quantitative Aptitude", slug: "foundation-maths", categoryId: cats["ca-foundation"]._id, sortOrder: 4 },
        /* CA Intermediate */
        { name: "Advanced Accounting", slug: "inter-advanced-accounting", categoryId: cats["ca-intermediate"]._id, sortOrder: 1 },
        { name: "Taxation", slug: "inter-taxation", categoryId: cats["ca-intermediate"]._id, sortOrder: 2 },
        { name: "Auditing", slug: "inter-auditing", categoryId: cats["ca-intermediate"]._id, sortOrder: 3 },
        /* CA Final */
        { name: "Financial Reporting", slug: "final-financial-reporting", categoryId: cats["ca-final"]._id, sortOrder: 1 },
        { name: "SFM", slug: "final-sfm", categoryId: cats["ca-final"]._id, sortOrder: 2 },
        { name: "Direct Tax", slug: "final-direct-tax", categoryId: cats["ca-final"]._id, sortOrder: 3 },
    ];

    const subcats = {};
    for (const d of subcatData) {
        const sub = await upsert(CourseSubcategory, { slug: d.slug }, d);
        subcats[d.slug] = sub;
        console.log(`✔  Subcategory: ${sub.name}`);
    }

    /* ── Faculty ─────────────────────────────────────── */
    const facultyData = [
        {
            name: "CA Kiranjeet Kaur",
            designation: "Chartered Accountant",
            bio: "CA Kiranjeet Kaur is a renowned Accounting faculty with over 12 years of experience teaching CA Foundation and Intermediate students. Known for her clarity of concepts and exam-oriented teaching style.",
            email: "kiranjeet@gkpro.com",
            isActive: true,
        },
        {
            name: "CA Rajesh Sharma",
            designation: "CA Final Expert",
            bio: "CA Rajesh Sharma specialises in Direct and Indirect Taxation with 15+ years of industry and teaching experience. His structured approach helps students crack the toughest tax papers.",
            email: "rajesh@gkpro.com",
            isActive: true,
        },
        {
            name: "CA Priya Mehta",
            designation: "Audit & Law Specialist",
            bio: "CA Priya Mehta is a distinguished faculty for Auditing and Business Laws with a passion for simplifying complex legal concepts for CA students at all levels.",
            email: "priya@gkpro.com",
            isActive: true,
        },
    ];

    const faculty = {};
    for (const d of facultyData) {
        const existing = await Faculty.findOne({ email: d.email });
        const f = existing || await Faculty.create(d);
        faculty[d.email] = f;
        console.log(`✔  Faculty: ${f.name}`);
    }

    /* ── Courses ─────────────────────────────────────── */
    const courseDefs = [
        {
            title: "CA Foundation – Accounting",
            slug: "ca-foundation-accounting",
            categoryId: cats["ca-foundation"]._id,
            subcategoryId: subcats["foundation-accounting"]._id,
            description: "Master core accounting concepts, financial statements, and practical problem-solving for CA exams.",
            overview:
                "This comprehensive course covers the complete CA Foundation Accounting syllabus prescribed by ICAI. Students will learn fundamental accounting principles, preparation of financial statements, partnership accounts, company accounts, and more.\n\nOur teaching methodology combines concept lectures, solved examples, practice questions, and regular mock tests to ensure thorough exam preparation.",
            onlinePrice: 8500,
            onlineOriginalPrice: 10100,
            recordedPrice: 5500,
            recordedOriginalPrice: 7000,
            availableModes: "both",
            numLectures: "70 – 75 Lectures (Approx)",
            duration: "150 Hours",
            language: "Hindi / English",
            highlights: ["Live doubt sessions", "Study material included", "Mock tests", "Valid for 12 months"],
            prerequisites: ["Class 12 pass", "CA Foundation registration"],
            faculty: [faculty["kiranjeet@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
        {
            title: "CA Foundation – Business Laws",
            slug: "ca-foundation-business-laws",
            categoryId: cats["ca-foundation"]._id,
            subcategoryId: subcats["foundation-business-laws"]._id,
            description: "Understand Indian Contract Act, Sale of Goods Act, and other essential business laws for CA Foundation.",
            overview:
                "This course provides a thorough understanding of all Business Law topics covered in the CA Foundation syllabus. From the Indian Contract Act 1872 to the Companies Act basics, students will develop the legal understanding needed to score well in Paper 2.",
            onlinePrice: 7500,
            onlineOriginalPrice: 9000,
            recordedPrice: 4500,
            recordedOriginalPrice: 6000,
            availableModes: "both",
            numLectures: "55 – 60 Lectures (Approx)",
            duration: "110 Hours",
            language: "Hindi / English",
            highlights: ["Simplified language", "Case-study based learning", "Previous year Q&A"],
            prerequisites: ["Class 12 pass", "CA Foundation registration"],
            faculty: [faculty["priya@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
        {
            title: "CA Foundation – Quantitative Aptitude",
            slug: "ca-foundation-maths",
            categoryId: cats["ca-foundation"]._id,
            subcategoryId: subcats["foundation-maths"]._id,
            description: "Build a strong foundation in Maths, Statistics, and Business Economics for CA exams.",
            overview:
                "CA Foundation Quantitative Aptitude covers Ratio & Proportion, Logarithms, Equations, Matrices, Statistics, and Basic Business Mathematics. This course is designed to build speed and accuracy needed to excel in Paper 3 of CA Foundation.",
            onlinePrice: 6500,
            onlineOriginalPrice: 8000,
            recordedPrice: null,
            recordedOriginalPrice: null,
            availableModes: "online",
            numLectures: "60 Lectures (Approx)",
            duration: "120 Hours",
            language: "Hindi",
            highlights: ["Formula sheets", "Practice sheets after every chapter", "Weekly tests"],
            prerequisites: ["Class 12 Maths (preferred)"],
            faculty: [faculty["kiranjeet@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
        {
            title: "CA Intermediate – Advanced Accounting",
            slug: "ca-inter-advanced-accounting",
            categoryId: cats["ca-intermediate"]._id,
            subcategoryId: subcats["inter-advanced-accounting"]._id,
            description: "Deep dive into AS, partnership, corporate accounts, and financial statements as per ICAI Intermediate syllabus.",
            overview:
                "This course covers the complete CA Intermediate Advanced Accounting syllabus. Topics include Accounting Standards, Branch Accounts, Hire Purchase, Investment Accounts, Departmental Accounts, Company Final Accounts, and more.",
            onlinePrice: 12000,
            onlineOriginalPrice: 15000,
            recordedPrice: 8000,
            recordedOriginalPrice: 10500,
            availableModes: "both",
            numLectures: "90 – 95 Lectures",
            duration: "200 Hours",
            language: "Hindi / English",
            highlights: ["ICAI-pattern practice sets", "Live revision lectures", "Doubt portal access"],
            prerequisites: ["CA Foundation cleared"],
            faculty: [faculty["kiranjeet@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
        {
            title: "CA Intermediate – Taxation (DT + GST)",
            slug: "ca-inter-taxation",
            categoryId: cats["ca-intermediate"]._id,
            subcategoryId: subcats["inter-taxation"]._id,
            description: "Complete coverage of Direct Tax and GST for CA Intermediate with practical case studies.",
            overview:
                "This course covers both Direct Tax (Income Tax Act) and Indirect Tax (GST) as per the CA Intermediate syllabus. Students will learn computation of income under all heads, GST levy and collection, input tax credit, registration, returns, and more.",
            onlinePrice: 13500,
            onlineOriginalPrice: 17000,
            recordedPrice: 9000,
            recordedOriginalPrice: 12000,
            availableModes: "both",
            numLectures: "100 – 110 Lectures",
            duration: "220 Hours",
            language: "Hindi / English",
            highlights: ["Updated for latest Finance Act", "GST portal practicals", "Revision sessions"],
            prerequisites: ["CA Foundation cleared"],
            faculty: [faculty["rajesh@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
        {
            title: "CA Final – Direct Tax Laws",
            slug: "ca-final-direct-tax",
            categoryId: cats["ca-final"]._id,
            subcategoryId: subcats["final-direct-tax"]._id,
            description: "Comprehensive Direct Tax preparation for CA Final including International Tax and Transfer Pricing.",
            overview:
                "CA Final Direct Tax Laws is one of the most scoring yet challenging papers. This course covers all provisions of the Income Tax Act 1961, relevant case laws, DTAA, Transfer Pricing, and Black Money Act.\n\nCA Rajesh Sharma's structured approach ensures students understand not just theory but also practical application, which is crucial for the 100-mark paper.",
            onlinePrice: 18000,
            onlineOriginalPrice: 22000,
            recordedPrice: 12000,
            recordedOriginalPrice: 15000,
            availableModes: "both",
            numLectures: "120 – 130 Lectures",
            duration: "280 Hours",
            language: "Hindi / English",
            highlights: ["Case law discussions", "Amendments covered", "ICAI Mock Tests", "Printed notes"],
            prerequisites: ["CA Intermediate cleared", "Articleship ongoing"],
            faculty: [faculty["rajesh@gkpro.com"]._id],
            status: "published",
            approvalStatus: "approved",
        },
    ];

    for (const d of courseDefs) {
        const existing = await Course.findOne({ slug: d.slug });
        if (existing) {
            console.log(`–  Course already exists: ${d.title}`);
            continue;
        }
        await Course.create({ ...d, createdBy: admin._id, approvedBy: admin._id });
        console.log(`✔  Course: ${d.title}`);
    }

    console.log("\n✅  Seed complete.");
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
