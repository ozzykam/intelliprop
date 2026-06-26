'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepIndicator } from '../layout';

const STORAGE_KEY = 'intelliprop_signup';

function SignupStep1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [properties, setProperties] = useState('');
  const [units, setUnits] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const pre = searchParams.get('email');
    if (pre) setEmail(pre);
    // Restore partial data if they navigate back
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.email && !pre) setEmail(saved.email);
      if (saved.phone) setPhone(saved.phone);
      if (saved.properties) setProperties(String(saved.properties));
      if (saved.units) setUnits(String(saved.units));
    } catch { /* ignore */ }
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      properties: parseInt(properties) || 0,
      units: parseInt(units) || 0,
    }));

    router.push('/signup/plan');
  }

  return (
    <div className="w-full max-w-lg">
      <div className="flex justify-center mb-8">
        <StepIndicator current={0} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-6">Start your 14-day free trial. No credit card required yet.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First name</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last name</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone number <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Properties in portfolio</label>
              <input type="number" min="0" value={properties} onChange={e => setProperties(e.target.value)}
                placeholder="0"
                className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Total units</label>
              <input type="number" min="0" value={units} onChange={e => setUnits(e.target.value)}
                placeholder="0"
                className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
            <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <button type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md text-sm hover:opacity-90 transition-opacity mt-2">
            Continue to Plan Selection →
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Were you invited to join an organization as a tenant or employee?{' '}
            <a href="/activate" className="text-primary hover:underline font-medium">
              Activate your account here →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupStep1Content />
    </Suspense>
  );
}
