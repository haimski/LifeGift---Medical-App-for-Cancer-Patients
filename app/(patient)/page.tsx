"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPatientContext } from "@/lib/context/patientContext";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const context = getPatientContext();
    router.replace(context ? "/chat" : "/onboarding");
  }, [router]);

  return null;
}
