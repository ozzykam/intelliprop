'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface FeeItem {
  id: string;
  feeType: string;
  description: string;
  amountCents: number;
  date: string;
  paidDate?: string;
  status: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

interface FeesPageProps {
  params: Promise<{ llcId: string; caseId: string }>;
}

const FEE_TYPE_LABELS: Record<string, string> = {
  attorney_fees: 'Attorney Fees',
  filing_fees: 'Filing Fees',
  court_costs: 'Court Costs',
  process_server: 'Process Server',
  expert_witness: 'Expert Witness',
  deposition: 'Deposition',
  mediation: 'Mediation',
  other: 'Other',
};

const FEE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  waived: 'bg-gray-100 text-gray-600',
  disputed: 'bg-red-100 text-red-700',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string): string {
  // Date-only strings (YYYY-MM-DD) should not be shifted by timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const parts = iso.split('-').map(Number) as [number, number, number];
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildCaseName(c: {
  docketNumber?: string;
  plaintiff?: { type: string; name?: string; llcName?: string };
  opposingParty?: { name?: string; tenantName?: string }[] | { name?: string; tenantName?: string };
}): string {
  const plaintiffName = c.plaintiff?.type === 'llc' ? c.plaintiff.llcName : c.plaintiff?.name || '';
  const parts = (
    Array.isArray(c.opposingParty)
      ? c.opposingParty.map((op) => op.name || op.tenantName).filter(Boolean)
      : [c.opposingParty?.name || c.opposingParty?.tenantName].filter(Boolean)
  ) as string[];
  let opposingNames = 'Unknown Opposing Party';
  if (parts.length === 1) {
    opposingNames = parts[0] ?? 'Unknown Opposing Party';
  } else if (parts.length === 2) {
    opposingNames = `${parts[0] ?? ''} & ${parts[1] ?? ''}`;
  } else if (parts.length > 2) {
    opposingNames = `${parts.slice(0, -1).join(', ')}, & ${parts.at(-1) ?? ''}`;
  }
  const caseStyle = plaintiffName ? `${plaintiffName} v. ${opposingNames}` : opposingNames;
  return c.docketNumber ? `${c.docketNumber} — ${caseStyle}` : caseStyle;
}

const EMPTY_FORM = {
  feeType: 'attorney_fees',
  description: '',
  amount: '',
  date: '',
  paidDate: '',
  status: 'pending',
  invoiceNumber: '',
  notes: '',
};

export default function FeesPage({ params }: FeesPageProps) {
  const { llcId, caseId } = use(params);

  const [fees, setFees] = useState<FeeItem[]>([]);
  const [caseName, setCaseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [feesRes, caseRes] = await Promise.all([
        fetch(`/api/llcs/${llcId}/cases/${caseId}/fees`),
        fetch(`/api/llcs/${llcId}/cases/${caseId}`),
      ]);
      const [feesData, caseData] = await Promise.all([feesRes.json(), caseRes.json()]);

      if (feesData.ok) {
        setFees(feesData.data);
      } else {
        setError(feesData.error?.message || 'Failed to load fees');
      }

      if (caseData.ok) {
        setCaseName(buildCaseName(caseData.data));
      }
    } catch {
      setError('Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [llcId, caseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed summary
  const totalCents = fees.reduce((sum, f) => sum + f.amountCents, 0);
  const paidCents = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amountCents, 0);
  const pendingCents = fees.filter((f) => f.status === 'pending').reduce((sum, f) => sum + f.amountCents, 0);

  function dollarsToCents(value: string): number {
    const n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.round(n * 100);
  }

  function centsToDisplay(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  const handleAdd = async () => {
    if (!addForm.description.trim() || !addForm.date) {
      setAddError('Description and date are required.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeType: addForm.feeType,
          description: addForm.description.trim(),
          amountCents: dollarsToCents(addForm.amount),
          date: addForm.date,
          paidDate: addForm.paidDate || undefined,
          status: addForm.status,
          invoiceNumber: addForm.invoiceNumber.trim() || undefined,
          notes: addForm.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFees((prev) => [data.data, ...prev]);
        setAddForm(EMPTY_FORM);
        setShowAdd(false);
      } else {
        setAddError(data.error?.message || 'Failed to add fee');
      }
    } catch {
      setAddError('Failed to add fee');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (fee: FeeItem) => {
    setEditingId(fee.id);
    setEditError('');
    setEditForm({
      feeType: fee.feeType,
      description: fee.description,
      amount: centsToDisplay(fee.amountCents),
      date: fee.date,
      paidDate: fee.paidDate || '',
      status: fee.status,
      invoiceNumber: fee.invoiceNumber || '',
      notes: fee.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.description.trim() || !editForm.date) {
      setEditError('Description and date are required.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/fees/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeType: editForm.feeType,
          description: editForm.description.trim(),
          amountCents: dollarsToCents(editForm.amount),
          date: editForm.date,
          paidDate: editForm.paidDate || undefined,
          status: editForm.status,
          invoiceNumber: editForm.invoiceNumber.trim() || undefined,
          notes: editForm.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFees((prev) => prev.map((f) => (f.id === editingId ? data.data : f)));
        setEditingId(null);
      } else {
        setEditError(data.error?.message || 'Failed to save changes');
      }
    } catch {
      setEditError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feeId: string, desc: string) => {
    if (!confirm(`Delete fee "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/fees/${feeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setFees((prev) => prev.filter((f) => f.id !== feeId));
        if (editingId === feeId) setEditingId(null);
      } else {
        alert(data.error?.message || 'Failed to delete fee');
      }
    } catch {
      alert('Failed to delete fee');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading fees...</div>;
  }

  const renderForm = (
    form: typeof EMPTY_FORM,
    setForm: (f: typeof EMPTY_FORM) => void,
    onSubmit: () => void,
    onCancel: () => void,
    submitLabel: string,
    submitting: boolean,
    formError: string
  ) => (
    <div className="p-4 border rounded-lg space-y-3">
      {formError && (
        <div className="p-2 bg-destructive/10 text-destructive rounded text-sm">{formError}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fee Type</label>
          <select
            value={form.feeType}
            onChange={(e) => setForm({ ...form, feeType: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            {Object.entries(FEE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Initial retainer payment"
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Incurred *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Paid</label>
          <input
            type="date"
            value={form.paidDate}
            onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Invoice # (optional)</label>
        <input
          value={form.invoiceNumber}
          onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
          placeholder="e.g. INV-2024-001"
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md text-sm hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <Link href={`/llcs/${llcId}/legal`} className="hover:text-foreground">
          Cases
        </Link>
        <span>&nbsp;/</span>
        <Link href={`/llcs/${llcId}/legal/${caseId}`} className="hover:text-foreground">
          {caseName || 'Case'}
        </Link>
        <span>&nbsp;/</span>
        <span className="text-foreground font-medium">Legal Fees</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Legal Fees</h1>
        <button
          onClick={() => { setShowAdd(!showAdd); setAddError(''); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          {showAdd ? 'Cancel' : '+ Add Fee'}
        </button>
      </div>

      {error && <div className="mb-4 text-destructive text-sm">{error}</div>}

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Fees</div>
          <div className="text-xl font-semibold">{formatCents(totalCents)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Paid</div>
          <div className="text-xl font-semibold text-green-700">{formatCents(paidCents)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Pending</div>
          <div className="text-xl font-semibold text-yellow-700">{formatCents(pendingCents)}</div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-6">
          {renderForm(
            addForm,
            setAddForm,
            handleAdd,
            () => { setShowAdd(false); setAddForm(EMPTY_FORM); setAddError(''); },
            'Add Fee',
            adding,
            addError
          )}
        </div>
      )}

      {/* Fees table */}
      {fees.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No fees recorded yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fees.map((fee) => (
                <Fragment key={fee.id}>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(fee.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {FEE_TYPE_LABELS[fee.feeType] || fee.feeType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{fee.description}</div>
                      {fee.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5">{fee.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {fee.invoiceNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCents(fee.amountCents)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${FEE_STATUS_COLORS[fee.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => editingId === fee.id ? setEditingId(null) : startEdit(fee)}
                        className="text-muted-foreground hover:text-foreground mr-3 text-xs"
                      >
                        {editingId === fee.id ? 'Close' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(fee.id, fee.description)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {editingId === fee.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-secondary/20">
                        {renderForm(
                          editForm,
                          setEditForm,
                          handleSaveEdit,
                          () => setEditingId(null),
                          'Save Changes',
                          saving,
                          editError
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
