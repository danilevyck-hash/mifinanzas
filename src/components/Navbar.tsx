"use client";

import Link from "next/link";

export default function Navbar() {
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
              className="bg-accent/20 text-accent-light hover:bg-accent/30 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Gastos
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
