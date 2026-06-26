import Link from 'next/link';

const STEPS = ['Your Info', 'Choose Plan', 'Get Started'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 ${i < current ? 'text-primary' : i === current ? 'text-slate-900' : 'text-slate-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              i < current ? 'bg-primary border-primary text-primary-foreground' :
              i === current ? 'border-slate-900 text-slate-900' :
              'border-slate-300 text-slate-400'
            }`}>
              {i < current ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px ${i < current ? 'bg-primary' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">IntelliProp</span>
          </Link>

          {/* Step indicator — passed via a server component data attribute workaround isn't needed;
              pages render their own step number via a client component if needed. */}
          <div id="step-indicator" />

          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t bg-white">
        © {new Date().getFullYear()} IntelliProp ·{' '}
        <Link href="/privacy" className="hover:underline">Privacy</Link> ·{' '}
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}

export { StepIndicator };
