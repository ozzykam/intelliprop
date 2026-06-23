'use client';

import { useState, useRef, useEffect } from 'react';

export interface UserOption {
  id: string;
  email: string;
  displayName?: string;
}

interface UserSearchInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  /** API endpoint to search. Must accept ?search= and return { ok, data: UserOption[] } */
  endpoint?: string;
  onSelect: (user: UserOption) => void;
  onClear?: () => void;
  /** Controlled selected value display string */
  selectedDisplay?: string;
}

export default function UserSearchInput({
  label,
  description,
  placeholder = 'Search by name or email...',
  endpoint = '/api/admin/users',
  onSelect,
  onClear,
  selectedDisplay,
}: UserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (onClear) onClear();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) { setResults([]); setShowDropdown(false); return; }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${endpoint}?search=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.ok) {
          setResults(data.data.slice(0, 8));
          setShowDropdown(true);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 300);
  }

  function handleSelect(user: UserOption) {
    setQuery(user.displayName ?? user.email);
    setResults([]);
    setShowDropdown(false);
    onSelect(user);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1.5">{label}</label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mb-1.5">{description}</p>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-8"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {selectedDisplay && (
        <p className="mt-1 text-xs text-muted-foreground">Selected: {selectedDisplay}</p>
      )}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg divide-y max-h-48 overflow-y-auto">
          {results.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
            >
              <div className="font-medium">{user.displayName ?? user.email}</div>
              {user.displayName && (
                <div className="text-xs text-muted-foreground">{user.email}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
