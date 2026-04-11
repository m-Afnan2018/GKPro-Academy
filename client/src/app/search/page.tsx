import type { Metadata } from "next";
import SearchContent from "./SearchContent";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for courses, blogs, and categories on GKPro Academy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchPage() {
  return <SearchContent />;
}
