'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/main',
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Organizations',
    href: '/main/organizations',
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Users',
    href: '/main/users',
    exact: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

function getPlatformViewOrgCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)__platform_view_org=([^;]+)/);
  return match ? (match[1] ?? null) : null;
}

export default function PlatformSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activeOrg, setActiveOrg] = useState<{ id: string; name: string } | null>(null);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('platform-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  // Read cookie and fetch org name if one is active
  useEffect(() => {
    const orgId = getPlatformViewOrgCookie();
    if (!orgId) { setActiveOrg(null); return; }
    fetch(`/api/admin/organizations/${orgId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setActiveOrg({ id: orgId, name: d.data.name }); })
      .catch(() => {});
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed(p => {
      localStorage.setItem('platform-sidebar-collapsed', String(!p));
      return !p;
    });
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className={`hidden md:flex flex-col border-r bg-card transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Collapse toggle */}
      <div className="flex items-center justify-end px-3 py-3 border-b">
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Platform
          </p>
        )}
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to org — only shown when a platform view org cookie is active */}
      {activeOrg && (
        <div className="px-2 py-3 border-t">
          <Link
            href={`/${activeOrg.id}`}
            title={collapsed ? `Back to ${activeOrg.name}` : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {!collapsed && (
              <span className="truncate">Back to {activeOrg.name}</span>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
