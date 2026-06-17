'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserResult {
  id: string;
  email: string;
  displayName?: string;
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [ownerDisplay, setOwnerDisplay] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOwnerSearchChange(value: string) {
    setOwnerSearch(value);
    setOwnerUserId('');
    setOwnerDisplay('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) { setUserResults([]); setShowDropdown(false); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.ok) { setUserResults(data.data.slice(0, 8)); setShowDropdown(true); }
      } catch { /* silent */ }
    }, 300);
  }

  function selectOwner(user: UserResult) {
    setOwnerUserId(user.id);
    setOwnerDisplay(user.displayName ? `${user.displayName} (${user.email})` : user.email);
    setOwnerSearch(user.displayName ?? user.email);
    setShowDropdown(false);
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

        <div ref={searchRef} className="relative">
          <label className="block text-sm font-medium mb-1.5">Owner</label>
          <p className="text-xs text-muted-foreground mb-1.5">The user who will be the primary owner of this organization.</p>
          <input
            type="text"
            value={ownerSearch}
            onChange={e => handleOwnerSearchChange(e.target.value)}
            onFocus={() => userResults.length > 0 && setShowDropdown(true)}
            placeholder="Search by name or email..."
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {ownerUserId && (
            <p className="mt-1 text-xs text-muted-foreground">Selected: {ownerDisplay}</p>
          )}
          {showDropdown && userResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg divide-y max-h-48 overflow-y-auto">
              {userResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectOwner(user)}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                >
                  <div className="font-medium">{user.displayName ?? user.email}</div>
                  {user.displayName && <div className="text-xs text-muted-foreground">{user.email}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

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
