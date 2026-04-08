"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentToken, getStudentUser } from "@/lib/studentAuth";

export default function StudentGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStudentToken();
    const user = getStudentUser();
    if (!token || !user || user.role !== "student") {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
