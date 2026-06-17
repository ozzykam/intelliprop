'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRole } from '@/lib/contexts/RoleContext';
import { useRouter, usePathname } from 'next/navigation';
import GlobalSearch from './GlobalSearch';
import NavClockWidget from './NavClockWidget';

function getPlatformViewOrgCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)__platform_view_org=([^;]+)/);
  return match ? (match[1] ?? null) : null;
}

function clearPlatformViewOrgCookie() {
  document.cookie = '__platform_view_org=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { hasStaffRole, hasTenantRole, clearActiveRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [platformViewOrg, setPlatformViewOrg] = useState<{ id: string; name: string } | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [llcName, setLlcName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract orgId and llcId from pathname (e.g. /{orgId}/llcs/{llcId}/properties)
  const STATIC_SEGMENTS = new Set(['admin', 'financials', 'tenants', 'timesheets', 'activity', 'alerts', 'tasks', 'invitations', 'profile', 'llcs', 'main', 'org', 'portal', 'login']);
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentOrgId = pathSegments[0] && !STATIC_SEGMENTS.has(pathSegments[0]) ? pathSegments[0] : null;
  const llcIdMatch = pathname.match(/^\/[^/]+\/llcs\/([^/]+)/);
  const llcId = llcIdMatch ? llcIdMatch[1] : null;

  // Fetch org name when inside an org context
  useEffect(() => {
    if (!currentOrgId) { setOrgName(null); return; }
    fetch(`/api/orgs/${currentOrgId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setOrgName(d.data.name); })
      .catch(() => {});
  }, [currentOrgId]);

  // Detect platform admin org-view mode
  useEffect(() => {
    const orgId = getPlatformViewOrgCookie();
    if (!orgId) { setPlatformViewOrg(null); return; }
    fetch(`/api/admin/organizations/${orgId}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setPlatformViewOrg({ id: orgId, name: d.data.name });
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/invitations');
        const data = await res.json();
        if (data.ok) {
          setInvitationCount(data.data.length);
        }
      } catch {
        // Silently fail - not critical
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/portal/profile');
        const data = await res.json();
        if (data.ok && data.data?.displayName) {
          setDisplayName(data.data.displayName);
        }
      } catch {
        // Silently fail - fall back to email
      }
    };

    fetchInvitations();
    fetchProfile();
  }, [user]);

  // Fetch LLC name when inside an LLC route
  useEffect(() => {
    if (!llcId) {
      setLlcName(null);
      return;
    }

    const fetchLlcName = async () => {
      try {
        const res = await fetch('/api/llcs');
        const data = await res.json();
        if (data.ok) {
          const llc = data.data.find((l: { id: string }) => l.id === llcId);
          setLlcName(llc?.legalName || null);
        }
      } catch {
        setLlcName(null);
      }
    };

    fetchLlcName();
  }, [llcId]);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push('/');
  };

  const handleSwitchToTenant = () => {
    clearActiveRole();
    router.push('/');
  };

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const firstName = displayName
    ? displayName.split(' ')[0]
    : user?.email?.split('@')[0] || '';

  return (
    <>
      {/* Platform admin org-view banner */}
      {platformViewOrg && (
        <div className="bg-primary text-primary-foreground px-4 py-1.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">Platform Admin</span>
            <span className="opacity-70">·</span>
            <span>Viewing <strong>{platformViewOrg.name}</strong></span>
          </div>
          <button
            onClick={() => {
              clearPlatformViewOrgCookie();
              setPlatformViewOrg(null);
              router.push('/main');
            }}
            className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit to Platform
          </button>
        </div>
      )}

      <header className="border-b bg-card sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Link href={currentOrgId ? `/${currentOrgId}` : '/'} className="text-lg font-semibold hover:opacity-80 transition-opacity">
              {orgName ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'Property Platform'}
            </Link>
            {llcName && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {llcName}
                </span>
              </>
            )}
          </div>

          {/* Center - Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 rounded-md hover:bg-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-background rounded border">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center gap-4">
            {/* Mobile search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {hasTenantRole && (
              <button
                onClick={handleSwitchToTenant}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Switch to Tenant
              </button>
            )}

            {/* Clock widget — staff only */}
            {hasStaffRole && <NavClockWidget />}

            {/* Greeting */}
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Hi, {firstName}
            </span>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                aria-label="Profile menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50 py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </Link>

                  <Link
                    href="/invitations"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Invitations
                    {invitationCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full px-1">
                        {invitationCount}
                      </span>
                    )}
                  </Link>

                  <div className="border-t my-1" />

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={closeSearch} />
    </>
  );
}
