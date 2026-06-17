import { redirect } from 'next/navigation';
import { requirePermissionContext } from '@/lib/auth/permissionContext';
import PlatformTopBar from '@/components/platform/PlatformTopBar';
import PlatformSidebar from '@/components/platform/PlatformSidebar';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  let context;
  try {
    context = await requirePermissionContext();
  } catch {
    redirect('/login');
  }

  if (!context.isPlatformSuperAdmin) {
    redirect('/llcs');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PlatformSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <PlatformTopBar displayName={context.displayName} email={context.email} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
