"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-primary border-b-2 border-accent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight">
            MiFinanzas
          </Link>
          <div className="flex gap-1">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-accent text-white"
                  : "text-accent-light hover:bg-accent/20"
              }`}
            >
              Gastos
            </Link>
            <Link
              href="/resumen"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/resumen"
                  ? "bg-accent text-white"
                  : "text-accent-light hover:bg-accent/20"
              }`}
            >
              Resumen
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
