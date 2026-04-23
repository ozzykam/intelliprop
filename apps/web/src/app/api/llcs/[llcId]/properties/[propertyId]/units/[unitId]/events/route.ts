import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/requireUser';
import { requireLlcMember } from '@/lib/auth/requireLlcMember';
import { listLeases } from '@/lib/services/lease.service';
import { listWorkOrders } from '@/lib/services/workOrder.service';

interface RouteParams {
  params: Promise<{ llcId: string; propertyId: string; unitId: string }>;
}

interface UnitEvent {
  id: string;
  type: string;
  date: string;
  title: string;
  description?: string;
  badge: string;
}

const LEASE_BADGE = 'bg-blue-100 text-blue-800';
const MAINT_YELLOW = 'bg-yellow-100 text-yellow-800';
const MAINT_GREEN = 'bg-green-100 text-green-800';

function toDateString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.substring(0, 10);
  if (typeof value === 'object' && value !== null) {
    const ts = value as { toDate?: () => Date; seconds?: number };
    if (ts.toDate) return ts.toDate().toISOString().substring(0, 10);
    if (ts.seconds) return new Date(ts.seconds * 1000).toISOString().substring(0, 10);
  }
  return null;
}

/**
 * GET /api/llcs/[llcId]/properties/[propertyId]/units/[unitId]/events
 * Aggregated event history for a unit (leases + work orders).
 * Query params: start (ISO date), end (ISO date)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { llcId, propertyId, unitId } = await params;

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
      { status: 401 }
    );
  }

  try {
    await requireLlcMember(llcId);

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const [leases, workOrders] = await Promise.all([
      listLeases(llcId, propertyId, unitId),
      listWorkOrders(llcId, { propertyId, unitId }),
    ]);

    const events: UnitEvent[] = [];

    // Convert leases to events
    for (const rawLease of leases) {
      const lease = rawLease as Record<string, unknown>;
      const leaseId = lease.id as string;
      const tenantCount = Array.isArray(lease.tenantIds) ? (lease.tenantIds as string[]).length : 0;
      const tenantDesc = tenantCount > 0 ? `${tenantCount} tenant${tenantCount > 1 ? 's' : ''}` : undefined;

      const createdDate = toDateString(lease.createdAt);
      if (createdDate) {
        events.push({
          id: `${leaseId}_created`,
          type: 'lease_created',
          date: createdDate,
          title: 'Lease Created',
          description: tenantDesc,
          badge: LEASE_BADGE,
        });
      }

      const leaseStatus = lease.status as string;

      if (lease.startDate && ['active', 'ended', 'terminated'].includes(leaseStatus)) {
        events.push({
          id: `${leaseId}_started`,
          type: 'lease_started',
          date: lease.startDate as string,
          title: 'Lease Started',
          description: tenantDesc,
          badge: LEASE_BADGE,
        });
      }

      if (lease.endDate && leaseStatus === 'ended') {
        events.push({
          id: `${leaseId}_ended`,
          type: 'lease_ended',
          date: lease.endDate as string,
          title: 'Lease Ended',
          badge: LEASE_BADGE,
        });
      }

      if (leaseStatus === 'terminated') {
        const terminatedDate = toDateString(lease.updatedAt) || toDateString(lease.createdAt);
        if (terminatedDate) {
          events.push({
            id: `${leaseId}_terminated`,
            type: 'lease_terminated',
            date: terminatedDate,
            title: 'Lease Terminated',
            badge: LEASE_BADGE,
          });
        }
      }
    }

    // Convert work orders to events
    for (const wo of workOrders) {
      const createdDate = toDateString(wo.createdAt);
      if (createdDate) {
        events.push({
          id: `${wo.id}_created`,
          type: 'maintenance_created',
          date: createdDate,
          title: 'Maintenance Created',
          description: wo.title,
          badge: MAINT_YELLOW,
        });
      }

      if (wo.scheduledDate) {
        const scheduledDate = toDateString(wo.scheduledDate);
        if (scheduledDate) {
          events.push({
            id: `${wo.id}_scheduled`,
            type: 'maintenance_scheduled',
            date: scheduledDate,
            title: 'Maintenance Scheduled',
            description: wo.title,
            badge: MAINT_YELLOW,
          });
        }
      }

      if (wo.completedDate) {
        events.push({
          id: `${wo.id}_completed`,
          type: 'maintenance_completed',
          date: wo.completedDate,
          title: 'Maintenance Completed',
          description: wo.title,
          badge: MAINT_GREEN,
        });
      }
    }

    // Apply date range filter
    let filtered = events;
    if (startParam) {
      filtered = filtered.filter((e) => e.date >= startParam);
    }
    if (endParam) {
      filtered = filtered.filter((e) => e.date <= endParam);
    }

    // Sort by date descending
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ ok: true, data: filtered });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'No access' } },
        { status: 403 }
      );
    }
    console.error('Error fetching unit events:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' } },
      { status: 500 }
    );
  }
}
