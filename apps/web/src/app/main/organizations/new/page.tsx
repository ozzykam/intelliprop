'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UserSearchInput, { UserOption } from '@/components/UserSearchInput';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [ownerDisplay, setOwnerDisplay] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleOwnerSelect(user: UserOption) {
    setOwnerUserId(user.id);
    setOwnerDisplay(user.displayName ? `${user.displayName} (${user.email})` : user.email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Organization name is required.'); return; }
    if (!ownerUserId) { setError('Please select an owner from the search results.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ownerUserId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error?.message ?? 'Failed to create organization'); return; }
      router.push(`/admin/organizations/${data.data.id}`);
    } catch {
      setError('Failed to create organization');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/main/organizations" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Organizations
        </Link>
        <h1 className="text-2xl font-bold mt-2">New Organization</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new client organization on the platform.</p>
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
            placeholder="e.g. Acme Property Management LLC"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <UserSearchInput
          label="Owner"
          description="The user who will be the primary owner of this organization."
          onSelect={handleOwnerSelect}
          onClear={() => { setOwnerUserId(''); setOwnerDisplay(''); }}
          selectedDisplay={ownerUserId ? ownerDisplay : undefined}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/main/organizations" className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
