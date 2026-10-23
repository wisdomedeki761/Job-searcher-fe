"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Login moved to /login (the whole app is private now). */
export default function AdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
