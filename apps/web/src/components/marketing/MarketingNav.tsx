'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">{process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+18005550100"
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              +1 (800) 555-0100
            </a>
            <Link
              href="/login"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-md transition-opacity"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3">
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-slate-300 hover:text-white text-sm font-medium py-2 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileOpen(false)}
            className="block text-slate-300 hover:text-white text-sm font-medium py-2 transition-colors"
          >
            Contact
          </Link>
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-slate-300 hover:text-white text-sm font-medium py-2 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-md text-center transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
