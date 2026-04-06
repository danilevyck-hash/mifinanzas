"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <>
      {/* Top bar */}
      <nav className="bg-primary border-b-2 border-accent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="text-white font-semibold text-lg tracking-tight flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008C18.318 3.75 21 6.432 21 9.75v2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75C3 6.432 5.682 3.75 9 3.75h.008A3 3 0 019 9.75H5.25A2.25 2.25 0 003 12v6a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-6" />
                <circle cx="16.5" cy="12" r="1" fill="currentColor" />
              </svg>
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
                  Home
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
                  title="Configuracion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                {/* Dark mode toggle */}
                <button
                  onClick={toggle}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-accent-light/60 hover:text-white transition-colors"
                  title={dark ? "Modo claro" : "Modo oscuro"}
                >
                  {dark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
              pathname === "/" ? "text-accent" : "text-muted dark:text-gray-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </Link>
          <Link
            href="/resumen"
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-lg transition-colors ${
              pathname === "/resumen" ? "text-accent" : "text-muted dark:text-gray-400"
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
              pathname === "/cuenta" ? "text-accent" : "text-muted dark:text-gray-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Config</span>
          </Link>
        </div>
      </div>
    </>
  );
}
