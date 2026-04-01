'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  InsuranceClaim,
  ClaimDocument,
  ClaimTask,
  ClaimActivity,
  INSURANCE_CLAIM_STATUS_LABELS,
  INSURANCE_CLAIM_STATUS_COLORS,
  INSURANCE_CAUSE_OF_LOSS_LABELS,
  CLAIM_DOCUMENT_TYPE_LABELS,
  CLAIM_DOCUMENT_TYPES,
  ClaimDocumentType,
  CLAIM_ACTIVITY_TYPES,
  ClaimActivityType,
  CLAIM_ACTIVITY_TYPE_LABELS,
  CLAIM_ACTIVITY_TYPE_COLORS,
} from '@shared/types';

interface ClaimPageProps {
  params: Promise<{ llcId: string; policyId: string; claimId: string }>;
}

type Tab = 'overview' | 'parties' | 'appraisal' | 'documents' | 'tasks' | 'activities';

function formatCents(cents?: number) {
  if (cents === undefined || cents === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClaimDetailPage({ params }: ClaimPageProps) {
  const { llcId, policyId, claimId } = use(params);
  const router = useRouter();
  const basePath = `/llcs/${llcId}/insurance/${policyId}`;
  // API always uses the standalone claim endpoint (claims are stored top-level)
  const apiBase = `/api/llcs/${llcId}/insurance/claims/${claimId}`;

  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [appraisalExists, setAppraisalExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Document upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<ClaimDocumentType>('damage_photo');
  const [docDescription, setDocDescription] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appraisal initiation
  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [appraisalDemandDate, setAppraisalDemandDate] = useState('');
  const [appraisalDemandedBy, setAppraisalDemandedBy] = useState<'insured' | 'insurer'>('insured');
  const [appraisalNotes, setAppraisalNotes] = useState('');
  const [initiatingAppraisal, setInitiatingAppraisal] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState<ClaimTask[]>([]);
  const [tasksFetched, setTasksFetched] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskNotes, setEditTaskNotes] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');

  // Activities state
  const [activities, setActivities] = useState<ClaimActivity[]>([]);
  const [activitiesFetched, setActivitiesFetched] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<ClaimActivityType>('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [activityOccurredAt, setActivityOccurredAt] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityType, setEditActivityType] = useState<ClaimActivityType>('note');
  const [editActivityTitle, setEditActivityTitle] = useState('');
  const [editActivityNotes, setEditActivityNotes] = useState('');
  const [editActivityOccurredAt, setEditActivityOccurredAt] = useState('');
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [claimRes, docsRes, appraisalRes] = await Promise.all([
        fetch(`${apiBase}`),
        fetch(`${apiBase}/documents`),
        fetch(`${apiBase}/appraisal`),
      ]);

      const [claimData, docsData, appraisalData] = await Promise.all([
        claimRes.json(), docsRes.json(), appraisalRes.json(),
      ]);

      if (claimData.ok) setClaim(claimData.data);
      else setError(claimData.error?.message ?? 'Claim not found');

      if (docsData.ok) setDocuments(docsData.data);
      if (appraisalData.ok && appraisalData.data) setAppraisalExists(true);
    } catch {
      setError('Failed to load claim');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch(`${apiBase}/tasks`);
      const data = await res.json();
      if (data.ok) {
        setTasks(data.data);
        setTasksFetched(true);
      }
    } catch {
      // silently fail
    } finally {
      setTasksLoading(false);
    }
  }, [apiBase]);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`${apiBase}/activities`);
      const data = await res.json();
      if (data.ok) {
        setActivities(data.data);
        setActivitiesFetched(true);
      }
    } catch {
      // silently fail
    } finally {
      setActivitiesLoading(false);
    }
  }, [apiBase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tab === 'tasks' && !tasksFetched && !tasksLoading) fetchTasks();
    if (tab === 'activities' && !activitiesFetched && !activitiesLoading) fetchActivities();
  }, [tab, tasksFetched, tasksLoading, activitiesFetched, activitiesLoading, fetchTasks, fetchActivities]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        router.push(basePath);
      } else {
        alert(data.error?.message ?? 'Failed to delete claim');
        setDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch {
      alert('Failed to delete claim');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !docTitle) return;

    setUploading(true);
    setUploadError('');

    try {
      const urlRes = await fetch(`${apiBase}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const urlData = await urlRes.json();
      if (!urlData.ok) throw new Error(urlData.error?.message ?? 'Failed to get upload URL');

      const { uploadUrl, storagePath } = urlData.data;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      const metaRes = await fetch(`${apiBase}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          description: docDescription || undefined,
          type: docType,
          fileName: file.name,
          storagePath,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      const metaData = await metaRes.json();
      if (!metaData.ok) throw new Error(metaData.error?.message ?? 'Failed to save document');

      setDocuments(prev => [metaData.data, ...prev]);
      setShowUploadForm(false);
      setDocTitle('');
      setDocDescription('');
      setDocType('damage_photo');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc: ClaimDocument) {
    try {
      const res = await fetch(`${apiBase}/documents/${doc.id}`);
      const data = await res.json();
      if (data.ok) {
        window.open(data.data.downloadUrl, '_blank');
      } else {
        alert('Failed to get download link');
      }
    } catch {
      alert('Failed to get download link');
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch(`${apiBase}/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        alert(data.error?.message ?? 'Failed to delete document');
      }
    } catch {
      alert('Failed to delete document');
    }
  }

  async function handleInitiateAppraisal(e: React.FormEvent) {
    e.preventDefault();
    setInitiatingAppraisal(true);
    try {
      const res = await fetch(`${apiBase}/appraisal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandDate: appraisalDemandDate,
          demandedBy: appraisalDemandedBy,
          notes: appraisalNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAppraisalExists(true);
        setShowAppraisalForm(false);
        router.push(`${basePath}/claims/${claimId}/appraisal`);
      } else {
        alert(data.error?.message ?? 'Failed to initiate appraisal');
      }
    } catch {
      alert('Failed to initiate appraisal');
    } finally {
      setInitiatingAppraisal(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSavingTask(true);
    try {
      const res = await fetch(`${apiBase}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          notes: taskNotes.trim() || undefined,
          dueDate: taskDueDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTasks(prev => [...prev, data.data]);
        setShowTaskForm(false);
        setTaskTitle('');
        setTaskNotes('');
        setTaskDueDate('');
      } else {
        alert(data.error?.message ?? 'Failed to create task');
      }
    } catch {
      alert('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  }

  async function handleToggleTask(task: ClaimTask) {
    try {
      const res = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const data = await res.json();
      if (data.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? data.data : t));
      }
    } catch {
      alert('Failed to update task');
    }
  }

  function startEditTask(task: ClaimTask) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskNotes(task.notes ?? '');
    setEditTaskDueDate(task.dueDate ?? '');
  }

  async function handleSaveTaskEdit(taskId: string) {
    if (!editTaskTitle.trim()) return;
    try {
      const res = await fetch(`${apiBase}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          notes: editTaskNotes.trim() || undefined,
          dueDate: editTaskDueDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.data : t));
        setEditingTaskId(null);
      } else {
        alert(data.error?.message ?? 'Failed to save task');
      }
    } catch {
      alert('Failed to save task');
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${apiBase}/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        alert(data.error?.message ?? 'Failed to delete task');
      }
    } catch {
      alert('Failed to delete task');
    }
  }

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityTitle.trim()) return;
    setSavingActivity(true);
    try {
      const res = await fetch(`${apiBase}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityType,
          title: activityTitle.trim(),
          notes: activityNotes.trim() || undefined,
          occurredAt: activityOccurredAt || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActivities(prev => [data.data, ...prev]);
        setShowActivityForm(false);
        setActivityType('note');
        setActivityTitle('');
        setActivityNotes('');
        setActivityOccurredAt('');
      } else {
        alert(data.error?.message ?? 'Failed to log activity');
      }
    } catch {
      alert('Failed to log activity');
    } finally {
      setSavingActivity(false);
    }
  }

  function startEditActivity(activity: ClaimActivity) {
    setEditingActivityId(activity.id);
    setEditActivityType(activity.type);
    setEditActivityTitle(activity.title);
    setEditActivityNotes(activity.notes ?? '');
    setEditActivityOccurredAt(activity.occurredAt ?? '');
  }

  async function handleSaveActivityEdit(activityId: string) {
    if (!editActivityTitle.trim()) return;
    try {
      const res = await fetch(`${apiBase}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editActivityType,
          title: editActivityTitle.trim(),
          notes: editActivityNotes.trim() || undefined,
          occurredAt: editActivityOccurredAt || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setActivities(prev => prev.map(a => a.id === activityId ? data.data : a));
        setEditingActivityId(null);
      } else {
        alert(data.error?.message ?? 'Failed to save activity');
      }
    } catch {
      alert('Failed to save activity');
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm('Delete this activity?')) return;
    try {
      const res = await fetch(`${apiBase}/activities/${activityId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setActivities(prev => prev.filter(a => a.id !== activityId));
      } else {
        alert(data.error?.message ?? 'Failed to delete activity');
      }
    } catch {
      alert('Failed to delete activity');
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;

  if (error || !claim) {
    return (
      <div className="p-6">
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">← Policy</Link>
        <p className="mt-4 text-sm text-destructive">{error || 'Claim not found'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href={basePath} className="text-sm text-muted-foreground hover:text-foreground">
          ← {claim.carrier} #{claim.policyNumber}
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">
                {claim.claimNumber ? `Claim #${claim.claimNumber}` : 'Insurance Claim'}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INSURANCE_CLAIM_STATUS_COLORS[claim.status]}`}>
                {INSURANCE_CLAIM_STATUS_LABELS[claim.status]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {claim.entityName}
              {claim.causeOfLoss && ` · ${INSURANCE_CAUSE_OF_LOSS_LABELS[claim.causeOfLoss]}`}
              {` · Date of Loss: ${claim.dateOfLoss}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`${basePath}/claims/${claimId}/edit`}
              className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 border border-destructive text-destructive text-sm font-medium rounded-md hover:bg-destructive/5"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1 flex-wrap">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'parties', label: `Parties (${(claim.adjusters?.length ?? 0) + (claim.experts?.length ?? 0) + (claim.attorneys?.length ?? 0)})` },
          { key: 'appraisal', label: 'Appraisal' },
          { key: 'documents', label: `Documents (${documents.length})` },
          { key: 'tasks', label: `Tasks (${tasks.length})` },
          { key: 'activities', label: 'Activities' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="border rounded-lg p-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <InfoField label="Carrier" value={claim.carrier} />
            <InfoField label="Policy Number" value={claim.policyNumber} />
            {claim.claimNumber && <InfoField label="Claim Number" value={claim.claimNumber} />}
            {claim.causeOfLoss && <InfoField label="Cause of Loss" value={INSURANCE_CAUSE_OF_LOSS_LABELS[claim.causeOfLoss]} />}
            <InfoField label="Date of Loss" value={claim.dateOfLoss} />
            {claim.dateFiled && <InfoField label="Date Filed" value={claim.dateFiled} />}
            {claim.disputeType && (
              <InfoField
                label="Dispute Type"
                value={claim.disputeType === 'coverage' ? 'Coverage Dispute' : claim.disputeType === 'payment' ? 'Payment Dispute' : 'Appraisal'}
              />
            )}
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
          </div>

          <div className="border rounded-lg p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financials</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <InfoField label="Reported (Claimed)" value={formatCents(claim.reportedAmount)} />
              <InfoField label="Insurer Offer" value={formatCents(claim.offeredAmount)} />
              <InfoField label="Settled Amount" value={formatCents(claim.settledAmount)} />
              <InfoField label="Replacement Cost (RCV)" value={formatCents(claim.replacementCostValue)} />
              <InfoField label="Actual Cash Value (ACV)" value={formatCents(claim.actualCashValue)} />
              <InfoField label="Depreciation" value={formatCents(claim.depreciation)} />
            </div>
          </div>

          {claim.notes && (
            <div className="border rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{claim.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Parties Tab */}
      {tab === 'parties' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              href={`${basePath}/claims/${claimId}/edit`}
              className="text-sm text-primary hover:underline"
            >
              Edit Parties
            </Link>
          </div>

          <PartySection
            title="Adjusters"
            items={claim.adjusters ?? []}
            renderItem={(adj) => (
              <div key={adj.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{adj.name}</p>
                    {adj.firm && <p className="text-sm text-muted-foreground">{adj.firm}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                      {adj.type.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">Represents: {adj.represents}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  {adj.phone && <span>{adj.phone}</span>}
                  {adj.email && <span>{adj.email}</span>}
                  {adj.licenseNumber && <span>Lic #{adj.licenseNumber}</span>}
                </div>
              </div>
            )}
          />

          <PartySection
            title="Experts & Consultants"
            items={claim.experts ?? []}
            renderItem={(exp) => (
              <div key={exp.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{exp.name}</p>
                    {exp.firm && <p className="text-sm text-muted-foreground">{exp.firm}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {exp.specialty.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">Retained by: {exp.retainedBy}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  {exp.phone && <span>{exp.phone}</span>}
                  {exp.email && <span>{exp.email}</span>}
                </div>
              </div>
            )}
          />

          <PartySection
            title="Attorneys"
            items={claim.attorneys ?? []}
            renderItem={(att) => (
              <div key={att.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{att.name}</p>
                    {att.firmName && <p className="text-sm text-muted-foreground">{att.firmName}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                    Represents: {att.represents}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  {att.phone && <span>{att.phone}</span>}
                  {att.email && <span>{att.email}</span>}
                </div>
              </div>
            )}
          />

          {(claim.adjusters?.length ?? 0) === 0 &&
            (claim.experts?.length ?? 0) === 0 &&
            (claim.attorneys?.length ?? 0) === 0 && (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">No parties added yet.</p>
              <Link href={`${basePath}/claims/${claimId}/edit`} className="text-sm text-primary hover:underline mt-1 inline-block">
                Add adjusters, experts, or attorneys
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Appraisal Tab */}
      {tab === 'appraisal' && (
        <div className="space-y-4">
          {appraisalExists ? (
            <div className="border rounded-lg p-6 text-center">
              <p className="text-sm font-medium mb-3">Appraisal process is active for this claim.</p>
              <Link
                href={`${basePath}/claims/${claimId}/appraisal`}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
              >
                Open Appraisal Process →
              </Link>
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <h3 className="font-medium mb-1">Appraisal Process</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Under the policy&apos;s appraisal clause, either party may demand appraisal to resolve a dispute
                over the <strong>amount of loss</strong>. Appraisal does not decide coverage or payment conditions.
              </p>
              {!showAppraisalForm ? (
                <button
                  onClick={() => setShowAppraisalForm(true)}
                  className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
                >
                  Demand Appraisal
                </button>
              ) : (
                <form onSubmit={handleInitiateAppraisal} className="space-y-4 mt-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Demand Date <span className="text-destructive">*</span></label>
                      <input
                        type="date"
                        value={appraisalDemandDate}
                        onChange={e => setAppraisalDemandDate(e.target.value)}
                        required
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Demanded By</label>
                      <select
                        value={appraisalDemandedBy}
                        onChange={e => setAppraisalDemandedBy(e.target.value as 'insured' | 'insurer')}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="insured">Insured (Policyholder)</option>
                        <option value="insurer">Insurer (Carrier)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={appraisalNotes}
                      onChange={e => setAppraisalNotes(e.target.value)}
                      rows={2}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={initiatingAppraisal}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                      {initiatingAppraisal ? 'Initiating...' : 'Initiate Appraisal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAppraisalForm(false)}
                      className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowUploadForm(v => !v)}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
            >
              Upload Document
            </button>
          </div>

          {showUploadForm && (
            <form onSubmit={handleUpload} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-sm">Upload Document</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as ClaimDocumentType)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.values(CLAIM_DOCUMENT_TYPES).map(t => (
                      <option key={t} value={t}>{CLAIM_DOCUMENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={e => setDocDescription(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">File <span className="text-destructive">*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.doc,.docx"
                  className="w-full text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, WebP, HEIC, MP4, MOV, DOC, DOCX
                </p>
              </div>

              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {documents.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                        {CLAIM_DOCUMENT_TYPE_LABELS[doc.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">{doc.fileName}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-sm text-primary hover:underline"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-sm text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTaskForm(v => !v)}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
            >
              + Add Task
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="border rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                  autoFocus
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={taskNotes}
                  onChange={e => setTaskNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {savingTask ? 'Saving...' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTaskForm(false); setTaskTitle(''); setTaskNotes(''); setTaskDueDate(''); }}
                  className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {tasksLoading ? (
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4">
                  {editingTaskId === task.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={editTaskTitle}
                          onChange={e => setEditTaskTitle(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={e => setEditTaskDueDate(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                          value={editTaskNotes}
                          onChange={e => setEditTaskNotes(e.target.value)}
                          rows={2}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveTaskEdit(task.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => startEditTask(task)}
                          className={`text-sm text-left hover:text-primary ${task.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}
                        >
                          {task.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.dueDate && (
                            <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                              Due: {task.dueDate}
                            </span>
                          )}
                          {task.completed && task.completedAt && (
                            <span className="text-xs text-muted-foreground">Completed</span>
                          )}
                        </div>
                        {task.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-destructive hover:underline flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowActivityForm(v => !v)}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
            >
              + Log Activity
            </button>
          </div>

          {showActivityForm && (
            <form onSubmit={handleCreateActivity} className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value as ClaimActivityType)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.values(CLAIM_ACTIVITY_TYPES).map(t => (
                      <option key={t} value={t}>{CLAIM_ACTIVITY_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={activityOccurredAt}
                    onChange={e => setActivityOccurredAt(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={activityTitle}
                  onChange={e => setActivityTitle(e.target.value)}
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={activityNotes}
                  onChange={e => setActivityNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingActivity}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {savingActivity ? 'Saving...' : 'Log Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowActivityForm(false); setActivityTitle(''); setActivityNotes(''); setActivityOccurredAt(''); setActivityType('note'); }}
                  className="px-4 py-2 border text-sm font-medium rounded-md hover:bg-secondary/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activitiesLoading ? (
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          ) : activities.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">No activities logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map(activity => (
                <div key={activity.id} className="border rounded-lg p-4">
                  {editingActivityId === activity.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={editActivityType}
                            onChange={e => setEditActivityType(e.target.value as ClaimActivityType)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {Object.values(CLAIM_ACTIVITY_TYPES).map(t => (
                              <option key={t} value={t}>{CLAIM_ACTIVITY_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date</label>
                          <input
                            type="date"
                            value={editActivityOccurredAt}
                            onChange={e => setEditActivityOccurredAt(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={editActivityTitle}
                          onChange={e => setEditActivityTitle(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                          value={editActivityNotes}
                          onChange={e => setEditActivityNotes(e.target.value)}
                          rows={3}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveActivityEdit(activity.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingActivityId(null)}
                          className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${CLAIM_ACTIVITY_TYPE_COLORS[activity.type]}`}>
                            {CLAIM_ACTIVITY_TYPE_LABELS[activity.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.title}</p>
                            {activity.occurredAt && (
                              <p className="text-xs text-muted-foreground mt-0.5">{activity.occurredAt}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEditActivity(activity)}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {activity.notes && (
                        <div className="mt-2">
                          <button
                            onClick={() => setExpandedActivityIds(prev => {
                              const next = new Set(prev);
                              if (next.has(activity.id)) next.delete(activity.id);
                              else next.add(activity.id);
                              return next;
                            })}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {expandedActivityIds.has(activity.id) ? '▲ Hide notes' : '▼ Show notes'}
                          </button>
                          {expandedActivityIds.has(activity.id) && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{activity.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Delete Claim?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete this claim and all its documents.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-3 py-1.5 border text-sm font-medium rounded-md hover:bg-secondary/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-destructive text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

function PartySection<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-2">{items.map(renderItem)}</div>
    </div>
  );
}
