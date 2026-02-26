'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SignedDocument {
  id: string;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  uploadedAt: string;
  downloadUrl?: string;
}

interface AddendumChange {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

interface LeaseNote {
  id: string;
  text: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

interface LeaseAddendum {
  id: string;
  addendumNumber: number;
  draftId: string;
  packageId: string;
  changes: AddendumChange[];
  accepted: boolean;
  acceptedAt?: string;
  acceptedByUserId?: string;
  createdAt: string;
  createdByUserId: string;
}

interface PublishedLeaseData {
  id: string;
  llcId: string;
  draftId?: string;
  packageId?: string;
  leaseClass: string;
  express?: boolean;
  propertyId: string;
  unitIds: string[];
  tenantIds: string[];
  leaseType: string;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  dueDay: number;
  depositAmount: number;
  accepted: boolean;
  acceptedAt?: string;
  acceptedByUserId?: string;
  signedDocuments: SignedDocument[];
  addenda: LeaseAddendum[];
  notes: LeaseNote[];
  status: string;
  publishedAt: string;
  publishedByUserId: string;
}

interface PropertyItem {
  id: string;
  name?: string;
  address?: { street1?: string; city?: string; state?: string };
}

interface UnitItem {
  id: string;
  unitNumber: string;
}

interface TenantItem {
  id: string;
  type: 'individual' | 'business';
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

interface PageProps {
  params: Promise<{ llcId: string; publishedLeaseId: string }>;
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  terminated: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

export default function PublishedLeaseDetailPage({ params }: PageProps) {
  const { llcId, publishedLeaseId } = use(params);
  const router = useRouter();

  const [lease, setLease] = useState<PublishedLeaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Enrichment data
  const [propertyName, setPropertyName] = useState('');
  const [unitNumbers, setUnitNumbers] = useState('');
  const [tenantNames, setTenantNames] = useState('');

  // Document upload
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<(SignedDocument & { downloadUrl?: string })[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actions
  const [accepting, setAccepting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [creatingAddendum, setCreatingAddendum] = useState(false);
  const [addendumActionId, setAddendumActionId] = useState<string | null>(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [printingAddendumId, setPrintingAddendumId] = useState<string | null>(null);

  // Notes
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchLease = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases/${publishedLeaseId}`);
      const data = await res.json();
      if (data.ok) {
        setLease(data.data);
      } else {
        setError(data.error?.message || 'Failed to load lease');
      }
    } catch {
      setError('Failed to load lease');
    } finally {
      setLoading(false);
    }
  }, [llcId, publishedLeaseId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases/${publishedLeaseId}/documents`);
      const data = await res.json();
      if (data.ok) {
        setDocuments(data.data);
      }
    } catch {
      // silent
    }
  }, [llcId, publishedLeaseId]);

  const enrichData = useCallback(async (leaseData: PublishedLeaseData) => {
    // Fetch property
    if (leaseData.propertyId) {
      try {
        const res = await fetch(`/api/llcs/${llcId}/properties/${leaseData.propertyId}`);
        const data = await res.json();
        if (data.ok) {
          const prop = data.data as PropertyItem;
          const addr = prop.address;
          setPropertyName(
            addr ? `${addr.street1}, ${addr.city}, ${addr.state}` : prop.name || 'Unknown'
          );
        }
      } catch { /* silent */ }
    }

    // Fetch units
    if (leaseData.unitIds?.length && leaseData.propertyId) {
      try {
        const res = await fetch(`/api/llcs/${llcId}/properties/${leaseData.propertyId}/units`);
        const data = await res.json();
        if (data.ok) {
          const unitMap = new Map<string, UnitItem>();
          data.data.forEach((u: UnitItem) => unitMap.set(u.id, u));
          const nums = leaseData.unitIds
            .map(id => unitMap.get(id)?.unitNumber)
            .filter(Boolean);
          setUnitNumbers(nums.join(', ') || '—');
        }
      } catch { /* silent */ }
    }

    // Fetch tenants
    if (leaseData.tenantIds?.length) {
      try {
        const res = await fetch(`/api/llcs/${llcId}/tenants`);
        const data = await res.json();
        if (data.ok) {
          const tenantMap = new Map<string, TenantItem>();
          data.data.forEach((t: TenantItem) => tenantMap.set(t.id, t));
          const names = leaseData.tenantIds.map(id => {
            const t = tenantMap.get(id);
            if (!t) return null;
            if (t.type === 'business') return t.businessName || 'Unknown';
            return `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unknown';
          }).filter(Boolean);
          setTenantNames(names.join(', ') || '—');
        }
      } catch { /* silent */ }
    }
  }, [llcId]);

  useEffect(() => {
    fetchLease();
    fetchDocuments();
  }, [fetchLease, fetchDocuments]);

  useEffect(() => {
    if (lease) enrichData(lease);
  }, [lease, enrichData]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases/${publishedLeaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setLease(data.data);
      }
    } catch { /* silent */ }
    finally { setAccepting(false); }
  }

  async function handleStatusChange(newStatus: string) {
    if (!confirm(`Are you sure you want to mark this lease as "${newStatus}"?`)) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/published-leases/${publishedLeaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setLease(data.data);
      }
    } catch { /* silent */ }
    finally { setUpdatingStatus(false); }
  }

  async function handleUpdateLease() {
    setCreatingAddendum(true);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/addenda`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (data.ok) {
        router.push(`/llcs/${llcId}/lease-builder/${data.data.draftId}`);
      } else {
        alert(data.error?.message || 'Failed to create amendment draft');
      }
    } catch {
      alert('Failed to create amendment draft');
    } finally {
      setCreatingAddendum(false);
    }
  }

  async function handleAcceptAddendum(addendumId: string) {
    if (!confirm('Accept this addendum? This will apply the changes to the published lease.')) return;
    setAddendumActionId(addendumId);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/addenda/${addendumId}`,
        { method: 'PATCH' }
      );
      const data = await res.json();
      if (data.ok) {
        await fetchLease();
      } else {
        alert(data.error?.message || 'Failed to accept addendum');
      }
    } catch {
      alert('Failed to accept addendum');
    } finally {
      setAddendumActionId(null);
    }
  }

  async function handleDeleteAddendum(addendumId: string) {
    if (!confirm('Delete this addendum? This cannot be undone.')) return;
    setAddendumActionId(addendumId);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/addenda/${addendumId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        await fetchLease();
      } else {
        alert(data.error?.message || 'Failed to delete addendum');
      }
    } catch {
      alert('Failed to delete addendum');
    } finally {
      setAddendumActionId(null);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get upload URL
      const urlRes = await fetch(`/api/llcs/${llcId}/published-leases/${publishedLeaseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const urlData = await urlRes.json();
      if (!urlData.ok) throw new Error(urlData.error?.message);

      // 2. Upload to signed URL
      await fetch(urlData.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // 3. Confirm upload
      const confirmRes = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/documents/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePath: urlData.data.storagePath,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          }),
        }
      );
      const confirmData = await confirmRes.json();
      if (confirmData.ok) {
        await fetchDocuments();
      }
    } catch {
      alert('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/documents/${documentId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch {
      alert('Failed to delete document');
    }
  }

  async function handlePrintAddendum(addendum: LeaseAddendum) {
    setPrintingAddendumId(addendum.id);
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/packages/${addendum.packageId}/print`);
      const data = await res.json();
      if (data.ok) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(data.data.printableHtml);
          win.document.close();
        }
      } else {
        alert(data.error?.message || 'Failed to load addendum package');
      }
    } catch {
      alert('Failed to load addendum package');
    } finally {
      setPrintingAddendumId(null);
    }
  }

  async function handlePrintPackage() {
    if (!lease?.packageId) return;
    setPrintLoading(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/lease-builder/packages/${lease.packageId}/print`);
      const data = await res.json();
      if (data.ok) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(data.data.printableHtml);
          win.document.close();
        }
      } else {
        alert(data.error?.message || 'Failed to load lease package');
      }
    } catch {
      alert('Failed to load lease package');
    } finally {
      setPrintLoading(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: noteText.trim() }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setNoteText('');
        await fetchLease();
      } else {
        alert(data.error?.message || 'Failed to add note');
      }
    } catch {
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Delete this note?')) return;
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/published-leases/${publishedLeaseId}/notes/${noteId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        await fetchLease();
      } else {
        alert(data.error?.message || 'Failed to delete note');
      }
    } catch {
      alert('Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading published lease...</div>;
  }

  if (error || !lease) {
    return (
      <div>
        <Link href={`/llcs/${llcId}/leases`} className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Leases
        </Link>
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error || 'Published lease not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/llcs/${llcId}/leases`} className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Leases
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Published Lease — <span className="capitalize">{lease.leaseClass}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Published {formatDate(lease.publishedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lease.express && (
            <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
              Express
            </span>
          )}
          <span className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[lease.status] || 'bg-gray-100'}`}>
            {lease.status}
          </span>
          <Link
            href={`/llcs/${llcId}/published-leases/${publishedLeaseId}/charges`}
            className="px-3 py-1 text-sm border rounded hover:bg-secondary transition-colors"
          >
            Manage Charges
          </Link>
          {lease.status === 'active' && (
            <button
              onClick={() => handleStatusChange('terminated')}
              disabled={updatingStatus}
              className="px-3 py-1 text-sm text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              Terminate
            </button>
          )}
        </div>
      </div>

      {/* Lease Summary */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Lease Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Property:</span>{' '}
            <span className="font-medium">{propertyName || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Unit(s):</span>{' '}
            <span className="font-medium">{unitNumbers || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tenant(s):</span>{' '}
            <span className="font-medium">{tenantNames || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lease Type:</span>{' '}
            <span className="font-medium capitalize">{lease.leaseType.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Term:</span>{' '}
            <span className="font-medium">
              {formatDate(lease.startDate)} – {lease.endDate ? formatDate(lease.endDate) : 'Month-to-Month'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Monthly Rent:</span>{' '}
            <span className="font-medium">{formatMoney(lease.monthlyRent)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Due Day:</span>{' '}
            <span className="font-medium">{lease.dueDay}{ordinal(lease.dueDay)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Deposit:</span>{' '}
            <span className="font-medium">{formatMoney(lease.depositAmount)}</span>
          </div>
        </div>
      </div>

      {/* Acceptance */}
      <div className="border rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-medium">Acceptance</h2>
        {lease.accepted ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Accepted on {formatDate(lease.acceptedAt)}
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {accepting ? 'Accepting...' : 'Mark as Accepted'}
          </button>
        )}
      </div>

      {/* Generated Documents */}
      {lease.draftId && (
        <div className="border rounded-lg p-6 space-y-3">
          <h2 className="text-lg font-medium">Generated Documents</h2>
          <p className="text-sm text-muted-foreground">
            View the lease package documents generated by the lease builder.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/llcs/${llcId}/lease-builder/${lease.draftId}`}
              className="inline-block px-4 py-2 border border-input rounded-md hover:bg-secondary transition-colors text-sm"
            >
              View Generated Lease Package
            </Link>
            {lease.packageId && (
              <button
                onClick={handlePrintPackage}
                disabled={printLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
              >
                {printLoading ? 'Loading...' : 'Print Lease Package'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload signed lease documents and any other related files. Supported formats: PDF, Word, Images.
        </p>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            id="signed-doc-upload"
          />
          <label
            htmlFor="signed-doc-upload"
            className={`inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </label>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.sizeBytes)} — uploaded {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs border border-input rounded hover:bg-secondary transition-colors"
                    >
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="px-3 py-1 text-xs text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No signed documents uploaded yet.</p>
        )}
      </div>

      {/* Notes */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Notes</h2>
          {(lease.notes || []).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {(lease.notes || []).length}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            maxLength={2000}
            className="flex-1 px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !noteText.trim()}
            className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>

        {(lease.notes || []).length > 0 ? (
          <div className="space-y-3">
            {[...(lease.notes || [])].reverse().map((note) => (
              <div key={note.id} className="p-3 bg-muted/30 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{note.createdByName}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                    title="Delete note"
                    className="p-1.5 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No notes yet.</p>
        )}
      </div>

      {/* Addendum History */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Addendum History</h2>
          {lease.status === 'active' && !lease.express && (
            <button
              onClick={handleUpdateLease}
              disabled={creatingAddendum}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
            >
              {creatingAddendum ? 'Creating Draft...' : 'Update Lease'}
            </button>
          )}
        </div>

        {(lease.addenda || []).length > 0 ? (
          <div className="space-y-3">
            {lease.addenda.map((addendum) => (
              <div key={addendum.id} className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      Addendum #{addendum.addendumNumber}
                    </p>
                    {addendum.accepted ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(addendum.createdAt)}
                  </span>
                </div>
                {addendum.changes.length > 0 && (
                  <div className="space-y-1">
                    {addendum.changes.map((change, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground flex gap-2">
                        <span className="font-medium text-foreground min-w-0">{change.label}:</span>
                        <span className="text-red-600 line-through">{change.oldValue}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="text-green-700">{change.newValue}</span>
                      </div>
                    ))}
                  </div>
                )}
                {addendum.accepted ? (
                  <div className="flex items-center gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Accepted on {formatDate(addendum.acceptedAt)}
                    </p>
                    <button
                      onClick={() => handlePrintAddendum(addendum)}
                      disabled={printingAddendumId === addendum.id}
                      title="View"
                      className="p-1.5 border border-input rounded-md hover:bg-secondary disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleAcceptAddendum(addendum.id)}
                      disabled={addendumActionId === addendum.id}
                      title="Accept"
                      className="p-1.5 text-green-700 border border-green-300 rounded-md hover:bg-green-50 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteAddendum(addendum.id)}
                      disabled={addendumActionId === addendum.id}
                      title="Delete"
                      className="p-1.5 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePrintAddendum(addendum)}
                      disabled={printingAddendumId === addendum.id}
                      title="View"
                      className="p-1.5 border border-input rounded-md hover:bg-secondary disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {lease.express
              ? 'Addenda are not available for express leases.'
              : 'No addenda yet. Use "Update Lease" to amend terms.'}
          </p>
        )}
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? 'th';
}
