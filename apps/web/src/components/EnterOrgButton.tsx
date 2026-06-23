'use client';

import { useRouter } from 'next/navigation';

interface EnterOrgButtonProps {
  orgId: string;
}

export default function EnterOrgButton({ orgId }: EnterOrgButtonProps) {
  const router = useRouter();

  function handleEnterOrg() {
    const expires = new Date();
    expires.setTime(expires.getTime() + 14 * 24 * 60 * 60 * 1000);
    document.cookie = `__platform_view_org=${orgId};expires=${expires.toUTCString()};path=/`;
    router.push(`/${orgId}`);
  }

  return (
    <button
      onClick={handleEnterOrg}
      className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      Enter Organization
    </button>
  );
}
