import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-semibold">{process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'}</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enterprise-grade property management for real estate investors and landlords.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Log In</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'}. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs">
            Built for property investors who mean business.
          </p>
        </div>
      </div>
    </footer>
  );
}
