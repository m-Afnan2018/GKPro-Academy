import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GKPro — Student Portal",
  description: "Access your courses, track progress and manage your account.",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
