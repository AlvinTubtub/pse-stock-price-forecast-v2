"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // For /admin/login, do not render sidebar or admin header
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-dark-bg">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Sidebar */}
      <AdminSidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <AdminHeader onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
