import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for individual landlords just getting organized.',
    units: 'Up to 10 units',
    cta: 'Get Started',
    ctaHref: '/login',
    featured: false,
    features: [
      'Property & unit management',
      'Tenant management',
      'Lease tracking & renewals',
      'Charge & payment tracking',
      'Tenant portal',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For growing portfolios that need the full toolset.',
    units: 'Up to 50 units',
    cta: 'Get Started',
    ctaHref: '/login',
    featured: true,
    features: [
      'Everything in Starter',
      'Legal case management',
      'Insurance claims tracking',
      'Staff timesheets',
      'Work order management',
      'Financial dashboards',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large portfolios and property management firms.',
    units: 'Unlimited units',
    cta: 'Contact Sales',
    ctaHref: '/contact',
    featured: false,
    features: [
      'Everything in Professional',
      'Multiple organizations',
      'Custom onboarding',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom integrations',
      'Phone support',
    ],
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Header */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-300">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 bg-white ${
                  plan.featured
                    ? 'border-primary ring-2 ring-primary shadow-lg relative'
                    : 'border-slate-200'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                  <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{plan.units}</p>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`block w-full text-center py-2.5 rounded-md text-sm font-semibold mb-8 transition-opacity ${
                    plan.featured
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm mt-10">
            All plans include a 14-day free trial. No credit card required.{' '}
            <Link href="/contact" className="text-primary hover:underline">Questions? Talk to us.</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
