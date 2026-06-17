import { ReactNode } from 'react';
import { adminDb } from '@/lib/firebase/admin';
import LlcSidebar from '@/components/LlcSidebar';

interface LlcLayoutProps {
  children: ReactNode;
  params: Promise<{ orgId: string; llcId: string }>;
}

export default async function LlcLayout({ children, params }: LlcLayoutProps) {
  const { orgId, llcId } = await params;

  const llcDoc = await adminDb.collection('llcs').doc(llcId).get();
  const legalName = llcDoc.exists ? llcDoc.data()?.legalName : 'Unknown LLC';

  return (
    <div className="flex">
      <LlcSidebar orgId={orgId} llcId={llcId} legalName={legalName} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
