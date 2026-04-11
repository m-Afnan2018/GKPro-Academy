import type { Metadata } from "next";
import { Suspense } from "react";
import CourseDetailContent from "./CourseDetailContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/courses/${slug}`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (!json.success) throw new Error("not found");
    const course = json.data.course;
    const title = course.title as string;
    const description = (
      (course.description as string | undefined) ?? ""
    )
      .replace(/<[^>]+>/g, "")
      .slice(0, 160);
    return {
      title,
      description: description || `Enroll in ${title} at GKPro Academy. Expert faculty, live & recorded sessions.`,
      openGraph: {
        title: `${title} — GKPro Academy`,
        description: description || `Enroll in ${title} at GKPro Academy.`,
        url: `https://gkproacademy.com/courses/${slug}`,
        images: course.thumbnailUrl
          ? [{ url: course.thumbnailUrl, alt: title }]
          : [{ url: "/images/Banner.webp", alt: "GKPro Academy" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — GKPro Academy`,
        description: description || `Enroll in ${title} at GKPro Academy.`,
        images: course.thumbnailUrl ? [course.thumbnailUrl] : ["/images/Banner.webp"],
      },
    };
  } catch {
    return {
      title: "Course",
      description: "Explore expert-led courses at GKPro Academy.",
    };
  }
}

export default function CourseDetailPage() {
  return (
    <Suspense>
      <CourseDetailContent />
    </Suspense>
  );
}
