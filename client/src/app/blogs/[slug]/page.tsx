import type { Metadata } from "next";
import { Suspense } from "react";
import BlogPostContent from "./BlogPostContent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/blogs/${slug}`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (!json.success) throw new Error("not found");
    const blog = json.data.blog ?? json.data;
    const title = blog.title as string;
    const description = (
      (blog.content as string | undefined) ?? ""
    )
      .replace(/<[^>]+>/g, "")
      .slice(0, 160);
    return {
      title,
      description: description || `Read "${title}" on the GKPro Academy blog.`,
      openGraph: {
        title: `${title} — GKPro Academy Blog`,
        description: description || `Read "${title}" on the GKPro Academy blog.`,
        url: `https://gkproacademy.com/blogs/${slug}`,
        type: "article",
        images: blog.imageUrl
          ? [{ url: blog.imageUrl, alt: title }]
          : [{ url: "/images/Banner.webp", alt: "GKPro Academy" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} — GKPro Academy Blog`,
        description: description || `Read "${title}" on the GKPro Academy blog.`,
        images: blog.imageUrl ? [blog.imageUrl] : ["/images/Banner.webp"],
      },
    };
  } catch {
    return {
      title: "Blog Post",
      description: "Read insightful articles on the GKPro Academy blog.",
    };
  }
}

export default function BlogPostPage() {
  return (
    <Suspense>
      <BlogPostContent />
    </Suspense>
  );
}
