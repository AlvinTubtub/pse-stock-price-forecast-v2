"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import EducationalBanner from "@/components/EducationalBanner";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import AIChatbot from "@/components/AIChatbot";
import type { CompanySummary, LatestData } from "@/lib/types";

interface PublicLayoutWrapperProps {
  children: React.ReactNode;
  companies: CompanySummary[];
  latest: LatestData | null;
}

export default function PublicLayoutWrapper({
  children,
  companies,
  latest,
}: PublicLayoutWrapperProps) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-screen bg-dark-bg text-slate-200">{children}</div>;
  }

  return (
    <>
      <Navbar companies={companies} />
      <EducationalBanner latest={latest} />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-8">
        {children}
      </main>
      <AIChatbot />
      <MobileNav />
      <Footer />
    </>
  );
}
