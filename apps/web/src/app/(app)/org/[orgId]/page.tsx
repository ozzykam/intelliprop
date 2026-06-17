import { redirect } from 'next/navigation';

export default async function OrgRedirectPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  redirect(`/admin/organization/${orgId}`);
}
