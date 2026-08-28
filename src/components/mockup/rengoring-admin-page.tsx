"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Viderestiller til Uddelegering-fanen på rengøringssiden */
export function RengoringAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/rengoring?tab=uddelegering");
  }, [router]);

  return null;
}
