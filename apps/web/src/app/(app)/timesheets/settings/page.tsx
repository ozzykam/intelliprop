'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface SharedUser {
  userId: string;
  displayName: string;
  email: string;
}

export default function TimesheetSettingsPage() {
  const [sharedWith, setSharedWith] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SharedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId being acted on
  const [actionError, setActionError] = useState('');

  // ── Fetch current sharing list ───────────────

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/timesheets/settings');
      const json = await res.json();
      if (json.ok) {
        setSharedWith(json.data.sharedWith ?? []);
      } else if (res.status === 403) {
        setForbidden(true);
      } else {
        setError(json.error?.message ?? 'Failed to load settings');
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── User search (debounced) ──────────────────

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const res = await fetch(`/api/timesheets/settings/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.ok) {
          // Filter out users already in the shared list
          const existingIds = new Set(sharedWith.map((u) => u.userId));
          setSearchResults(json.data.filter((u: SharedUser) => !existingIds.has(u.userId)));
        } else {
          setSearchError(json.error?.message ?? 'Search failed');
        }
      } catch {
        setSearchError('Search failed');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, sharedWith]);

  // ── Add / Remove user ────────────────────────

  async function handleAdd(user: SharedUser) {
    setActionLoading(user.userId);
    setActionError('');
    try {
      const res = await fetch('/api/timesheets/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId: user.userId }),
      });
      const json = await res.json();
      if (json.ok) {
        setSharedWith((prev) => [...prev, user]);
        setSearchResults((prev) => prev.filter((u) => u.userId !== user.userId));
        setSearchQuery('');
      } else {
        setActionError(json.error?.message ?? 'Failed to add user');
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(userId: string) {
    setActionLoading(userId);
    setActionError('');
    try {
      const res = await fetch('/api/timesheets/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId }),
      });
      const json = await res.json();
      if (json.ok) {
        setSharedWith((prev) => prev.filter((u) => u.userId !== userId));
      } else {
        setActionError(json.error?.message ?? 'Failed to remove user');
      }
    } finally {
      setActionLoading(null);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-6 bg-secondary rounded w-48 animate-pulse" />
        <div className="h-40 bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="border rounded-lg p-6 bg-card text-center">
          <div className="text-muted-foreground mb-2">This page is only available to super-admins.</div>
          <Link href="/timesheets" className="text-sm text-primary hover:underline">← Back to Timesheets</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/timesheets" className="hover:text-foreground">Timesheets</Link>
        <span>/</span>
        <span className="text-foreground">Privacy Settings</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Timesheet Privacy Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your timesheets are <strong>private by default</strong>. Only users you explicitly add below
          can view your activity logs.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
          {error}
        </div>
      )}
      {actionError && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
          {actionError}
        </div>
      )}

      {/* Current shared-with list */}
      <div className="border rounded-lg bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">Who can see your timesheets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sharedWith.length === 0
              ? 'Nobody — your timesheets are visible only to you.'
              : `${sharedWith.length} ${sharedWith.length === 1 ? 'person has' : 'people have'} access to your timesheets.`}
          </p>
        </div>

        {sharedWith.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No one has been granted access yet.
          </div>
        ) : (
          <ul className="divide-y">
            {sharedWith.map((user) => (
              <li key={user.userId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{user.displayName}</div>
                  {user.email && (
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(user.userId)}
                  disabled={actionLoading === user.userId}
                  className="text-xs text-destructive hover:underline disabled:opacity-50 ml-4 flex-shrink-0"
                >
                  {actionLoading === user.userId ? 'Removing…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add user */}
      <div className="border rounded-lg bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">Grant access to a user</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search by email address. Only staff accounts are shown.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email…"
              className="w-full border rounded px-3 py-2 text-sm bg-background"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                Searching…
              </div>
            )}
          </div>

          {searchError && (
            <div className="text-xs text-destructive">{searchError}</div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <ul className="border rounded divide-y bg-background">
              {searchResults.map((result) => (
                <li
                  key={result.userId}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-secondary/50"
                >
                  <div>
                    <div className="text-sm font-medium">{result.displayName}</div>
                    <div className="text-xs text-muted-foreground">{result.email}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(result)}
                    disabled={actionLoading === result.userId}
                    className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:opacity-90 disabled:opacity-50 ml-4 flex-shrink-0"
                  >
                    {actionLoading === result.userId ? 'Adding…' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No matching users found.
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
        <strong>Note:</strong> Users you grant access to can view your timesheet entries and
        activity history, but cannot edit or delete them. You can revoke access at any time.
      </div>
    </div>
  );
}
