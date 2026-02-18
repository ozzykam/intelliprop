'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface ActivityItemWithActor {
  id: string;
  llcId: string;
  llcName: string;
  action: 'create' | 'update' | 'delete' | 'void';
  entityType: string;
  entityId: string;
  description: string;
  actorUserId: string;
  actorDisplayName: string;
  createdAt: string;
}

interface PaginatedData {
  items: ActivityItemWithActor[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const LIMIT_OPTIONS = [25, 50, 100, 200];

const ACTION_BADGE: Record<string, { label: string; className: string }> = {
  create: { label: 'Create', className: 'bg-green-100 text-green-800' },
  update: { label: 'Update', className: 'bg-blue-100 text-blue-800' },
  delete: { label: 'Delete', className: 'bg-red-100 text-red-800' },
  void:   { label: 'Void',   className: 'bg-orange-100 text-orange-800' },
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [data, setData] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/activity?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load activity');
      }
    } catch {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  const showingStart = data ? (page - 1) * limit + 1 : 0;
  const showingEnd = data ? Math.min(page * limit, data.total) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/llcs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm">Activity Log</span>
          </div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground text-sm">
            All actions across your LLCs
          </p>
        </div>

        {/* Per-page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="limit-select" className="text-sm text-muted-foreground">
            Per page:
          </label>
          <select
            id="limit-select"
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-destructive mb-4">{error}</div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-3 font-medium">Date/Time</th>
              <th className="text-left px-4 py-3 font-medium">LLC</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-secondary rounded animate-pulse w-24"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.items.length > 0 ? (
              data.items.map((item) => {
                const badge = ACTION_BADGE[item.action] ?? { label: item.action, className: 'bg-gray-100 text-gray-800' };
                return (
                  <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      {new Date(item.createdAt).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">{item.llcName}</td>
                    <td className="px-4 py-3">{item.actorDisplayName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.description}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No activity found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {showingStart} - {showingEnd} of {data.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
              className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
