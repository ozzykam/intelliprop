import { redirect } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';

export default async function LlcLegacyRedirect({ params }: { params: Promise<{ llcId: string }> }) {
  const { llcId } = await params;
  const llcDoc = await adminDb.collection('llcs').doc(llcId).get();
  const accountId = llcDoc.exists ? (llcDoc.data()?.accountId as string | undefined) : undefined;

  if (accountId) {
    redirect(`/${accountId}/llcs/${llcId}`);
  }

  redirect('/llcs');
}
