'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { SidebarProvider } from '@/lib/contexts/SidebarContext';
import TopBar from '@/components/TopBar';
import DashboardSidebar from '@/components/DashboardSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { loading } = useAuth();
  const pathname = usePathname();

  // Check if we're inside an LLC context (e.g., /{orgId}/llcs/{llcId}/properties)
  const pathSegments = pathname.split('/').filter(Boolean);
  const isInsideLlc = pathSegments[1] === 'llcs' && pathSegments.length >= 3 && pathSegments[2] !== 'new';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex">
          {!isInsideLlc && <DashboardSidebar />}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
