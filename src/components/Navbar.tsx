"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Top bar */}
      <nav className="bg-primary border-b-2 border-accent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="text-white font-semibold text-lg tracking-tight">
              MiFinanzas
            </Link>
            <div className="flex items-center gap-1">
              {user && (
                <span className="text-accent-light/70 text-sm mr-2 hidden sm:inline">
                  {user.display_name}
                </span>
              )}
              {/* Desktop nav links */}
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    pathname === "/" ? "bg-accent text-white" : "text-accent-light hover:bg-accent/20"
                  }`}
                >
                  Gastos
                </Link>
                <Link
                  href="/resumen"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    pathname === "/resumen" ? "bg-accent text-white" : "text-accent-light hover:bg-accent/20"
                  }`}
                >
                  Resumen
                </Link>
                <Link
                  href="/cuenta"
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                    pathname === "/cuenta" ? "text-white" : "text-accent-light/60 hover:text-white"
                  }`}
                  title="Mi cuenta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button
                  onClick={logout}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-accent-light/60 hover:text-white transition-colors"
                  title="Cerrar sesion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom nav - mobile only */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
              pathname === "/" ? "text-accent" : "text-muted"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Gastos</span>
          </Link>
          <Link
            href="/resumen"
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
              pathname === "/resumen" ? "text-accent" : "text-muted"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Resumen</span>
          </Link>
          <Link
            href="/cuenta"
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
              pathname === "/cuenta" ? "text-accent" : "text-muted"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Cuenta</span>
          </Link>
        </div>
      </div>
    </>
  );
}
