import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "Login / Register",
  description: "Sign in or create your GKPro Academy student account to access your courses and learning materials.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginContent />;
}
