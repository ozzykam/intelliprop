import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/checkPermission';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Active task data for admin sidebar
 */
interface AdminTaskView {
  id: string;
  caseId: string;
  llcId: string;
  llcName: string;
  opposingPartyName: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  createdAt: string;
}

/**
 * Enriched case data for admin view
 */
interface AdminCaseView {
  id: string;
  llcId: string;
  llcName: string;
  propertyId?: string;
  propertyAddress?: string;
  court: string;
  jurisdiction: string;
  docketNumber?: string;
  caseType: string;
  status: string;
  visibility: string;
  opposingPartyNames: string[];
  ourCounselNames: string[];
  filingDate?: string;
  nextHearingDate?: string;
  nextCourtDate?: { date: string; time?: string; type: string; judge?: string };
  taskCount: number;
  openTaskCount: number;
  documentCount: number;
  damagesSoughtCents?: number;
  resolution?: { type: string; date: string; amount?: number };
  createdAt: string;
}

/**
 * GET /api/admin/cases
 * Get all legal cases across all LLCs (super-admin only)
 * Query params:
 * - llcId: filter by LLC
 * - status: filter by status (open, stayed, settled, judgment, closed)
 * - caseType: filter by case type
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const llcIdFilter = searchParams.get('llcId');
    const statusFilter = searchParams.get('status');
    const caseTypeFilter = searchParams.get('caseType');

    // Get all LLCs first
    const llcsSnap = await adminDb.collection('llcs').get();
    const llcMap = new Map<string, string>();
    llcsSnap.docs.forEach(doc => {
      llcMap.set(doc.id, doc.data().legalName || 'Unknown LLC');
    });

    // Get all cases using collectionGroup
    const casesSnap = await adminDb.collectionGroup('cases').get();

    const cases: AdminCaseView[] = [];
    const activeTasks: AdminTaskView[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const caseDoc of casesSnap.docs) {
      const caseData = caseDoc.data();

      // Only process docs under llcs/{llcId}/cases path
      const pathParts = caseDoc.ref.path.split('/');
      const llcId = pathParts[1];
      if (!llcId || pathParts.length < 4 || pathParts[0] !== 'llcs' || pathParts[2] !== 'cases') continue;

      // Apply LLC filter
      if (llcIdFilter && llcId !== llcIdFilter) continue;

      // Apply status filter
      if (statusFilter && caseData.status !== statusFilter) continue;

      // Apply case type filter
      if (caseTypeFilter && caseData.caseType !== caseTypeFilter) continue;

      // Get property address if propertyId exists
      let propertyAddress: string | undefined;
      if (caseData.propertyId) {
        const propertyDoc = await adminDb
          .collection('llcs')
          .doc(llcId)
          .collection('properties')
          .doc(caseData.propertyId)
          .get();
        const property = propertyDoc.data();
        if (property?.address) {
          propertyAddress = `${property.address.street1}, ${property.address.city}, ${property.address.state}`;
        }
      }

      // Get opposing party names
      const opposingPartyNames: string[] = [];
      const opposingParty = caseData.opposingParty;
      if (Array.isArray(opposingParty)) {
        for (const party of opposingParty) {
          if (party.type === 'tenant' && party.tenantName) {
            opposingPartyNames.push(party.tenantName);
          } else if (party.name) {
            opposingPartyNames.push(party.name);
          }
        }
      } else if (opposingParty) {
        // Handle single object (legacy format)
        if (opposingParty.type === 'tenant' && opposingParty.tenantName) {
          opposingPartyNames.push(opposingParty.tenantName);
        } else if (opposingParty.name) {
          opposingPartyNames.push(opposingParty.name);
        }
      }

      // Get our counsel names
      const ourCounselNames: string[] = [];
      if (Array.isArray(caseData.ourCounsel)) {
        for (const counsel of caseData.ourCounsel) {
          if (counsel.name) ourCounselNames.push(counsel.name);
        }
      }

      // Get next court date
      let nextCourtDate: AdminCaseView['nextCourtDate'] | undefined;
      try {
        const courtDatesSnap = await adminDb
          .collection('llcs')
          .doc(llcId)
          .collection('cases')
          .doc(caseDoc.id)
          .collection('courtDates')
          .where('status', '==', 'scheduled')
          .where('date', '>=', today)
          .orderBy('date', 'asc')
          .limit(1)
          .get();

        const nextCourtDateDoc = courtDatesSnap.docs[0];
        if (nextCourtDateDoc) {
          const cd = nextCourtDateDoc.data();
          nextCourtDate = {
            date: cd.date,
            time: cd.time || undefined,
            type: cd.type,
            judge: cd.judge || undefined,
          };
        }
      } catch {
        // courtDates subcollection may not exist or may lack index
      }

      // Get task counts and collect active tasks
      let taskCount = 0;
      let openTaskCount = 0;
      try {
        const tasksSnap = await adminDb
          .collection('llcs')
          .doc(llcId)
          .collection('cases')
          .doc(caseDoc.id)
          .collection('tasks')
          .get();
        taskCount = tasksSnap.size;
        for (const taskDoc of tasksSnap.docs) {
          const taskData = taskDoc.data();
          const taskStatus = taskData.status;
          if (taskStatus === 'pending' || taskStatus === 'in_progress') {
            openTaskCount++;
            activeTasks.push({
              id: taskDoc.id,
              caseId: caseDoc.id,
              llcId,
              llcName: llcMap.get(llcId) || 'Unknown LLC',
              opposingPartyName: opposingPartyNames[0] || 'Unknown',
              title: taskData.title || 'Untitled Task',
              description: taskData.description || undefined,
              dueDate: taskData.dueDate || undefined,
              status: taskStatus,
              priority: taskData.priority || 'medium',
              createdAt: taskData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            });
          }
        }
      } catch {
        // tasks subcollection may not exist
      }

      // Get document count
      let documentCount = 0;
      try {
        const docsSnap = await adminDb
          .collection('llcs')
          .doc(llcId)
          .collection('cases')
          .doc(caseDoc.id)
          .collection('documents')
          .get();
        documentCount = docsSnap.size;
      } catch {
        // documents subcollection may not exist
      }

      // Build resolution
      let resolution: AdminCaseView['resolution'] | undefined;
      if (caseData.resolution) {
        resolution = {
          type: caseData.resolution.type,
          date: caseData.resolution.date,
          amount: caseData.resolution.amount,
        };
      }

      const createdAt = caseData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString();

      cases.push({
        id: caseDoc.id,
        llcId,
        llcName: llcMap.get(llcId) || 'Unknown LLC',
        propertyId: caseData.propertyId || undefined,
        propertyAddress,
        court: caseData.court || '',
        jurisdiction: caseData.jurisdiction || '',
        docketNumber: caseData.docketNumber || undefined,
        caseType: caseData.caseType || 'other',
        status: caseData.status || 'open',
        visibility: caseData.visibility || 'llcWide',
        opposingPartyNames,
        ourCounselNames,
        filingDate: caseData.filingDate || undefined,
        nextHearingDate: caseData.nextHearingDate || undefined,
        nextCourtDate,
        taskCount,
        openTaskCount,
        documentCount,
        damagesSoughtCents: typeof caseData.damagesSoughtCents === 'number' ? caseData.damagesSoughtCents : undefined,
        resolution,
        createdAt,
      });
    }

    // Sort by LLC name, then by createdAt desc
    cases.sort((a, b) => {
      const llcCompare = a.llcName.localeCompare(b.llcName);
      if (llcCompare !== 0) return llcCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });

    // Sort active tasks by dueDate ascending (soonest first), tasks without due dates last
    activeTasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return NextResponse.json({ ok: true, data: cases, activeTasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('PERMISSION_DENIED') || message.includes('Super-admin')) {
      return NextResponse.json(
        { ok: false, error: { code: 'PERMISSION_DENIED', message: 'Super-admin access required' } },
        { status: 403 }
      );
    }
    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } },
        { status: 401 }
      );
    }
    console.error('Error fetching admin cases:', error);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cases' } },
      { status: 500 }
    );
  }
}
