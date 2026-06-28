"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function GlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key !== "/" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      e.preventDefault();
      if (pathname === "/search") {
        // Focus the search input if already on the search page
        document
          .querySelector<HTMLInputElement>("input")
          ?.focus();
      } else {
        router.push("/search");
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router, pathname]);

  return null;
}
