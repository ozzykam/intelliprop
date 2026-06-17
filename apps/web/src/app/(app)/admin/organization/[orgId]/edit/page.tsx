'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditOrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const router = useRouter();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/main/organizations/${orgId}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setName(data.data.name ?? '');
        else setError(data.error?.message ?? 'Failed to load organization');
      })
      .catch(() => setError('Failed to load organization'))
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Organization name is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/main/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to update organization'); return; }
      router.push(`/admin/organization/${orgId}`);
    } catch {
      setError('Failed to update organization');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin/organization/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Organization
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Organization</h1>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="shrink-0 text-destructive/70 hover:text-destructive">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 border rounded-xl p-6 bg-card">
        <div>
          <label className="block text-sm font-medium mb-1.5">Organization Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/admin/organization/${orgId}`} className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
