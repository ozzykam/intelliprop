'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface UnitDetail {
  id: string;
  unitNumber: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: string;
  marketRent?: number;
  notes?: string;
}

interface Tenant {
  id: string;
  type: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

interface ActiveLease {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  tenantIds: string[];
  status: string;
}

interface UnitEvent {
  id: string;
  type: string;
  date: string;
  title: string;
  description?: string;
  badge: string;
}

interface UnitImage {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  caption?: string;
  url: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-gray-100 text-gray-800',
};

type DateRange = 'this_month' | 'last_30' | 'last_60' | 'last_6mo' | 'ytd' | 'last_12mo' | 'all';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'last_60', label: 'Last 60 Days' },
  { value: 'last_6mo', label: 'Last 6 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last_12mo', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
];

function getStartDate(range: DateRange): string | null {
  const now = new Date();
  switch (range) {
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    case 'last_30':
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    case 'last_60':
      return new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    case 'last_6mo':
      return new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString().substring(0, 10);
    case 'last_12mo':
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    case 'all':
      return null;
  }
}

function formatDate(dateStr: string): string {
  // Append T00:00:00 so the date is parsed as local time, not UTC
  return new Date(`${dateStr.substring(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTenantName(tenant: Tenant): string {
  if (tenant.type === 'business') return tenant.businessName || '—';
  const parts = [tenant.firstName, tenant.lastName].filter(Boolean);
  return parts.join(' ') || '—';
}

interface PageProps {
  params: Promise<{ llcId: string; propertyId: string; unitId: string }>;
}

export default function UnitDashboardPage({ params }: PageProps) {
  const { llcId, propertyId, unitId } = use(params);

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [activeLease, setActiveLease] = useState<ActiveLease | null>(null);
  const [tenantNames, setTenantNames] = useState('');
  const [events, setEvents] = useState<UnitEvent[]>([]);
  const [images, setImages] = useState<UnitImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('this_month');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit caption state
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [savingCaption, setSavingCaption] = useState(false);

  // Initial data fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const [unitRes, leasesRes, imagesRes, tenantsRes] = await Promise.all([
          fetch(`/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}`),
          fetch(`/api/llcs/${llcId}/leases?unitId=${unitId}&status=active`),
          fetch(`/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images`),
          fetch(`/api/llcs/${llcId}/tenants`),
        ]);

        const [unitData, leasesData, imagesData, tenantsData] = await Promise.all([
          unitRes.json(),
          leasesRes.json(),
          imagesRes.json(),
          tenantsRes.json(),
        ]);

        if (unitData.ok) {
          setUnit(unitData.data);
        } else {
          setError(unitData.error?.message || 'Failed to load unit');
          return;
        }

        if (imagesData.ok) {
          setImages(imagesData.data);
        }

        const tenantsMap = new Map<string, Tenant>();
        if (tenantsData.ok) {
          (tenantsData.data as Tenant[]).forEach((t) => tenantsMap.set(t.id, t));
        }

        if (leasesData.ok && leasesData.data.length > 0) {
          const lease = leasesData.data[0] as ActiveLease;
          setActiveLease(lease);
          const names = (lease.tenantIds || [])
            .map((tid: string) => tenantsMap.get(tid))
            .filter((t): t is Tenant => !!t)
            .map(getTenantName);
          setTenantNames(names.join(', ') || '—');
        }
      } catch {
        setError('Failed to load unit');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [llcId, propertyId, unitId]);

  // Events fetch — re-runs on dateRange change (after initial load completes)
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const startDate = getStartDate(dateRange);
      const qs = startDate ? `?start=${startDate}` : '';
      const res = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/events${qs}`
      );
      const data = await res.json();
      if (data.ok) {
        setEvents(data.data);
      }
    } catch {
      // silently fail events
    } finally {
      setEventsLoading(false);
    }
  }, [llcId, propertyId, unitId, dateRange]);

  useEffect(() => {
    if (!loading) {
      fetchEvents();
    }
  }, [fetchEvents, loading]);

  // Upload flow: get signed URL → PUT file → POST metadata → refresh list
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');

    try {
      const urlRes = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/upload-url`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: uploadFile.name, contentType: uploadFile.type }),
        }
      );
      const urlData = await urlRes.json();
      if (!urlData.ok) {
        setUploadError(urlData.error?.message || 'Failed to get upload URL');
        return;
      }
      const { uploadUrl, storagePath } = urlData.data;

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type },
        body: uploadFile,
      });

      const metaRes = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePath,
            fileName: uploadFile.name,
            contentType: uploadFile.type,
            sizeBytes: uploadFile.size,
            caption: uploadCaption || undefined,
          }),
        }
      );
      const metaData = await metaRes.json();
      if (!metaData.ok) {
        setUploadError(metaData.error?.message || 'Failed to save image');
        return;
      }

      // Refresh image list to get signed read URLs
      const imagesRes = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images`
      );
      const imagesData = await imagesRes.json();
      if (imagesData.ok) setImages(imagesData.data);

      setShowUpload(false);
      setUploadFile(null);
      setUploadCaption('');
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const startEditCaption = (image: UnitImage) => {
    setEditingImageId(image.id);
    setEditCaption(image.caption || '');
  };

  const saveCaption = async (imageId: string) => {
    setSavingCaption(true);
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/${imageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: editCaption }),
        }
      );
      const data = await res.json();
      if (data.ok) {
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, caption: editCaption } : img))
        );
        setEditingImageId(null);
      }
    } catch {
      // ignore
    } finally {
      setSavingCaption(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    try {
      const res = await fetch(
        `/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}/images/${imageId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (error || !unit) {
    return <div className="text-destructive">{error || 'Unit not found'}</div>;
  }

  const detailParts = [
    unit.bedrooms != null ? `${unit.bedrooms} bd` : null,
    unit.bathrooms != null ? `${unit.bathrooms} ba` : null,
    unit.sqft ? `${unit.sqft.toLocaleString()} sqft` : null,
    unit.marketRent
      ? `$${(unit.marketRent / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} / mo`
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/llcs/${llcId}/properties/${propertyId}/units`}
            className="text-sm text-muted-foreground hover:text-foreground mb-3 inline-block"
          >
            &larr; Back to Units
          </Link>
          <h1 className="text-2xl font-bold">Unit {unit.unitNumber}</h1>
        </div>
        <Link
          href={`/llcs/${llcId}/properties/${propertyId}/units/${unitId}/edit`}
          className="shrink-0 px-4 py-2 border border-input rounded-md text-sm hover:bg-secondary transition-colors"
        >
          Edit Unit &rarr;
        </Link>
      </div>

      {/* Status / Details card */}
      <div className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-medium uppercase ${
              STATUS_COLORS[unit.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {unit.status}
          </span>
          {detailParts.length > 0 && (
            <span className="text-sm text-muted-foreground">{detailParts.join('  ·  ')}</span>
          )}
        </div>

        {activeLease && (
          <div className="text-sm flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-muted-foreground">Tenant:</span>
            <span className="font-medium">{tenantNames}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Lease active {formatDate(activeLease.startDate)} – {formatDate(activeLease.endDate)}
            </span>
            <Link
              href={`/llcs/${llcId}/leases/${activeLease.id}`}
              className="text-primary hover:underline"
            >
              view &rarr;
            </Link>
          </div>
        )}

        {unit.notes && (
          <p className="text-sm text-muted-foreground border-t pt-2">{unit.notes}</p>
        )}
      </div>

      {/* Event History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Unit History</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="text-sm border border-input rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DATE_RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {eventsLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No events in this period.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-36">Date</th>
                  <th className="text-left px-4 py-3 font-medium w-48">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${event.badge}`}>
                        {event.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{event.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floorplan & Images */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Floorplan &amp; Images</h2>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="text-sm px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              + Upload Image
            </button>
          )}
        </div>

        {/* Inline upload panel */}
        {showUpload && (
          <div className="border rounded-lg p-4 mb-4 space-y-3">
            <h3 className="font-medium text-sm">Upload Image</h3>
            {uploadError && (
              <div className="text-sm text-destructive">{uploadError}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                File <span className="text-muted-foreground font-normal">(JPG, PNG, or WebP)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caption (optional)</label>
              <textarea
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                rows={2}
                placeholder="Describe this image..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadFile(null);
                  setUploadCaption('');
                  setUploadError('');
                }}
                className="px-4 py-2 border border-input rounded-md text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Image grid */}
        {images.length === 0 ? (
          <div className="text-center py-10 border rounded-lg text-muted-foreground text-sm">
            No images yet. Upload a floorplan or photo.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-secondary">
                  {image.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={image.caption || image.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No preview
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {editingImageId === image.id ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Caption..."
                        autoFocus
                        className="w-full px-2 py-1 border border-input rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveCaption(image.id)}
                          disabled={savingCaption}
                          className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingImageId(null)}
                          className="text-xs px-2.5 py-1 border border-input rounded hover:bg-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.caption || 'No caption'}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditCaption(image)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Edit caption
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
