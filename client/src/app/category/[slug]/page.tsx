import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryContent from "./CategoryContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/categories/slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (!json.success) throw new Error("not found");
    const category = json.data;
    const name = category.name as string;
    const description = (category.description as string | undefined)
      ?.slice(0, 160);
    return {
      title: name,
      description:
        description ||
        `Browse ${name} courses at GKPro Academy. Expert-led classes with live and recorded options.`,
      openGraph: {
        title: `${name} Courses — GKPro Academy`,
        description:
          description ||
          `Explore ${name} courses at GKPro Academy. Expert faculty, flexible learning modes.`,
        url: `https://gkproacademy.com/category/${slug}`,
        images: category.imageUrl
          ? [{ url: category.imageUrl, alt: name }]
          : [{ url: "/images/Banner.webp", alt: "GKPro Academy" }],
      },
    };
  } catch {
    return {
      title: "Course Category",
      description: "Explore expert-led course categories at GKPro Academy.",
    };
  }
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  );
}
