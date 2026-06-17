'use client';

import { usePathname } from 'next/navigation';

export function useOrgId(): string {
  const pathname = usePathname();
  return pathname.split('/').filter(Boolean)[0] ?? '';
}
