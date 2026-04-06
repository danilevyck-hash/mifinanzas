"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = pathname === "/login" || pathname === "/registro" || pathname === "/privacidad";

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPage) {
      router.replace("/login?expired=1");
    } else if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [user, loading, isPublicPage, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#8E8E93] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#8E8E93] text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPublicPage) return null;

  return (
    <>
      {!isPublicPage && <Navbar />}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-6 animate-fade-in">
        {children}
      </main>
    </>
  );
}
