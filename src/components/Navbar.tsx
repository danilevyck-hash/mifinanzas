"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-primary border-b-2 border-accent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight">
            MiFinanzas
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" ? "bg-accent text-white" : "text-accent-light hover:bg-accent/20"
              }`}
            >
              Gastos
            </Link>
            <Link
              href="/resumen"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/resumen" ? "bg-accent text-white" : "text-accent-light hover:bg-accent/20"
              }`}
            >
              Resumen
            </Link>
            {user && (
              <>
                <span className="text-accent-light/60 text-xs ml-2 hidden sm:inline">
                  {user.display_name}
                </span>
                <button
                  onClick={logout}
                  className="text-accent-light/60 hover:text-white text-xs ml-1 transition-colors"
                  title="Cerrar sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
