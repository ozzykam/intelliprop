'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRole } from '@/lib/contexts/RoleContext';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';

// ── Feature pillars (alternating image+text sections) ─────────────────────────

const PILLARS = [
  {
    id: 'properties',
    label: 'Properties & Units',
    heading: 'Your entire portfolio, always in view.',
    body: `Stop juggling spreadsheets. ${process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} gives you a single dashboard for every property, unit, and tenant — with real-time occupancy, maintenance status, and lease expiry alerts built in.`,
    bullets: [
      'Track occupancy rates across all properties',
      'Work order management for maintenance requests',
      'Unit-level lease and tenant history',
      'Expiring lease alerts and renewal workflows',
    ],
    visual: 'bg-slate-200',
    image: '/images/marketing/properties-dashboard.webp',
    reverse: false,
  },
  {
    id: 'leases',
    label: 'Leases & Tenants',
    heading: 'Leases done right, from draft to renewal.',
    body: `Create digital leases, collect e-signatures, and give tenants a self-service portal to pay rent, submit maintenance requests, and view their documents — without a single phone call.`,
    bullets: [
      'Digital lease builder with e-signature',
      'Tenant portal for payments & requests',
      'Automated rent reminders and receipts',
      'Screening, application, and onboarding',
    ],
    visual: 'bg-slate-300',
    image: '/images/marketing/leases-and-tenants.webp',
    reverse: true,
  },
  {
    id: 'financials',
    label: 'Financials',
    heading: 'Know your numbers. Always.',
    body: `Real-time accounts receivable, automated charge creation, and a complete AR dashboard so you always know who owes what — and how overdue it is.`,
    bullets: [
      'Automated rent charges and late fees',
      'Overdue tracking with aging reports',
      'Payment history per tenant and lease',
      'Monthly income and occupancy dashboards',
    ],
    visual: 'bg-slate-200',
    image: '/images/marketing/financials-dashboard.webp',
    reverse: false,
  },
  {
    id: 'legal',
    label: 'Legal & Insurance',
    heading: 'Handle disputes before they become disasters.',
    body: `From eviction filings to insurance claim appraisals, ${process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} centralizes your legal and insurance operations so nothing falls through the cracks.`,
    bullets: [
      'Legal case management (eviction, collections, conciliation)',
      'Court date tracking, deadlines, and attorney notes',
      'Insurance policy and claims workflow',
      'Document storage and case history',
    ],
    visual: 'bg-slate-300',
    image: '/images/marketing/legal-cases.webp',
    reverse: true,
  },
];

const STATS = [
  { value: '500+', label: 'Properties Managed' },
  { value: '10,000+', label: 'Leases Processed' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '50+', label: 'Legal Case Types Supported' },
];

const STEPS = [
  {
    number: '01',
    title: 'Add Your Portfolio',
    description: 'Set up your LLCs, properties, and units in minutes. Import existing data or start from scratch.',
  },
  {
    number: '02',
    title: 'Onboard Your Tenants',
    description: 'Create digital leases, collect e-signatures, and give tenants their own portal to pay rent and submit requests.',
  },
  {
    number: '03',
    title: 'Run Everything From One Place',
    description: 'Track rent, manage legal matters, file insurance claims, and keep your staff accountable — without switching between tools.',
  },
];

// Placeholder press logos (text-based since we have no image assets)
// const PRESS_LOGOS = [
//   'Forbes', 'The Wall Street Journal', 'BiggerPockets', 'Inman', 'Realtor Magazine', 'Yahoo Finance',
// ];

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    loading: roleLoading,
    activeRole,
    needsRoleSelection,
    hasStaffRole,
    hasTenantRole,
    isPlatformSuperAdmin,
    setActiveRole,
  } = useRole();
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [heroEmail, setHeroEmail] = useState('');

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) return;

    if (isPlatformSuperAdmin) { router.replace('/main'); return; }

    if (needsRoleSelection) {
      setShowRoleModal(true);
    } else if (activeRole === 'staff') {
      router.replace('/llcs');
    } else if (activeRole === 'tenant') {
      router.replace('/portal');
    } else if (hasStaffRole) {
      router.replace('/llcs');
    } else if (hasTenantRole) {
      router.replace('/portal');
    } else {
      router.replace('/llcs');
    }
  }, [user, authLoading, roleLoading, activeRole, needsRoleSelection, hasStaffRole, hasTenantRole, isPlatformSuperAdmin, router]);

  const handleSelectStaff = () => { setActiveRole('staff'); setShowRoleModal(false); router.push('/llcs'); };
  const handleSelectTenant = () => { setActiveRole('tenant'); setShowRoleModal(false); router.push('/portal'); };

  function handleHeroSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/signup${heroEmail ? `?email=${encodeURIComponent(heroEmail)}` : ''}`);
  }

  if (authLoading || (user && roleLoading)) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  }

  if (user && !showRoleModal) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-muted-foreground">Redirecting...</div></div>;
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/20 text-primary border border-primary/30 mb-6">
              Property Management Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Stop Managing Properties.<br />
              <span className="text-primary">Start Running a Business.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'} puts your entire rental portfolio on autopilot. Leases, rent collection, legal cases, insurance claims, and staff management all in a single platform built for serious investors.
            </p>

            {/* Inline email CTA */}
            <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row  max-w-md mx-auto mb-5">
              <input
                type="email"
                value={heroEmail}
                onChange={e => setHeroEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 mr-0 rounded-l-md text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-6 py-3 ml-0 bg-gray-800 text-primary-foreground font-semibold rounded-r-md hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
              >
                Get Started Free
              </button>
            </form>
            <p className="text-xs text-slate-400">No credit card required · 14-day free trial · <Link href="/pricing" className="underline hover:text-slate-300">View pricing</Link></p>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-slate-800 pt-12">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Press / trust strip ─────────────────────────────────────────────────
      <section className="bg-slate-800 border-y border-slate-700 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">As seen in</span>
            {PRESS_LOGOS.map(name => (
              <span key={name} className="text-slate-500 font-semibold text-sm tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── Anchor nav ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-16 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-1 scrollbar-none">
            {PILLARS.map(p => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className="flex-shrink-0 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
              >
                {p.label}
              </a>
            ))}
            <a
              href="#how-it-works"
              className="flex-shrink-0 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap"
            >
              How It Works
            </a>
          </div>
        </div>
      </nav>

      {/* ── Feature pillars (alternating) ─────────────────────────────────────── */}
      {PILLARS.map((pillar, i) => (
        <section
          key={pillar.id}
          id={pillar.id}
          className={`py-20 lg:py-28 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Visual — order-2 on desktop when reversed so it appears on the right */}
              <div className={pillar.reverse ? 'lg:order-2' : ''}>
                {pillar.image ? (
                    <Image
                      src={pillar.image}
                      alt={pillar.label}
                      width={800}
                      height={600}
                      className="w-full h-auto object-cover"
                    />
                ) : (
                  <div className={`rounded-2xl aspect-[4/3] ${pillar.visual} flex items-center justify-center`}>
                    <div className="text-center text-slate-400 p-8">
                      <div className="w-16 h-16 rounded-full bg-slate-300 mx-auto mb-3 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Product screenshot</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text — order-1 on desktop when reversed so it appears on the left */}
              <div className={pillar.reverse ? 'lg:order-1' : ''}>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">{pillar.label}</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">{pillar.heading}</h2>
                <p className="text-slate-500 text-lg leading-relaxed mb-6">{pillar.body}</p>
                <ul className="space-y-3">
                  {pillar.bullets.map(b => (
                    <li key={b} className="flex items-start gap-3 text-slate-700 text-sm">
                      <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ── Staff & Timesheets — simple card, no image ────────────────────────── */}
      <section id="staff" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">Staff & Timesheets</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Keep your team accountable.</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            Clock-in/out tracking, role-based access, and staff assignment management — so you always know who's working, where, and on what.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {['Clock-in / clock-out tracking', 'Role-based access control', 'Staff assignments per LLC & property'].map(f => (
              <div key={f} className="bg-slate-800 rounded-xl p-5 text-sm text-slate-300 border border-slate-700">
                <svg className="w-5 h-5 text-primary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Up and running in minutes</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">No lengthy onboarding. No training required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 text-white text-lg font-bold flex items-center justify-center mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to take control of your portfolio?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join landlords and investors who manage their entire real estate operation in {process.env.NEXT_PUBLIC_APP_NAME ?? 'IntelliProp'}.
          </p>
          <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto">
            <input
              type="email"
              value={heroEmail}
              onChange={e => setHeroEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-md text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-800 text-primary-foreground font-semibold rounded-r-md hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
            >
              Get Started Free
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      <RoleSelectionModal
        open={showRoleModal}
        onSelectStaff={handleSelectStaff}
        onSelectTenant={handleSelectTenant}
      />
    </>
  );
}
