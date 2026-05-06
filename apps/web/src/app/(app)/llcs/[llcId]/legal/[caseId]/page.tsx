'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface CaseResolution {
  type: string;
  date: string;
  amount?: number;
  terms?: string;
  notes?: string;
}

interface OpposingPartyData {
  type: 'tenant' | 'other';
  tenantId?: string;
  tenantName?: string;
  propertyAddress?: string;
  email?: string;
  phone?: string;
  name?: string;
  entityType?: 'individual' | 'business';
  address?: { street1: string; city: string; state: string; zipCode: string };
}

interface CounselData {
  name: string;
  email?: string;
  phone?: string;
  firmName?: string;
  address?: string;
}

interface CaseData {
  id: string;
  court: string;
  jurisdiction: string;
  docketNumber?: string;
  caseType: string;
  status: string;
  visibility: string;
  plaintiff?: {
    type: 'individual' | 'llc';
    name?: string;
    llcId?: string;
    llcName?: string;
  };
  opposingParty?: OpposingPartyData[] | OpposingPartyData;
  opposingCounsel?: CounselData[] | CounselData;
  ourCounsel?: CounselData[] | CounselData | string;
  caseManagers: string[];
  damagesSoughtCents?: number;
  filingDate?: string;
  nextHearingDate?: string;
  resolution?: CaseResolution;
  description?: string;
  tags: string[];
  createdAt: string;
}

interface CourtDate {
  id: string;
  type: string;
  date: string;
  time?: string;
  judge?: string;
  courtroom?: string;
  description?: string;
  status: string;
  outcome?: string;
  outcomeNotes?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedToUserId?: string;
}

interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  storagePath?: string;
}

interface FeeRecord {
  id: string;
  feeType: string;
  description: string;
  amountCents: number;
  date: string;
  status: string;
}

interface ActivityRecord {
  id: string;
  caseId: string;
  llcId: string;
  activityType: string;
  description: string;
  relatedTaskId?: string;
  relatedCourtDateId?: string;
  relatedDocumentId?: string;
  visibility: string;
  createdByUserId: string;
  editHistory?: { description: string; editedAt: string; editedByUserId: string }[];
  createdAt: string;
  updatedAt?: string;
}

const DOCUMENT_TYPES = [
  { value: 'filing', label: 'Filing' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'notice', label: 'Notice' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_order', label: 'Court Order' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_TYPES: Record<string, string> = {
  internal_note: 'Internal Note',
  phone_call: 'Phone Call',
  voicemail: 'Voicemail',
  email_sent: 'Email Sent',
  email_received: 'Email Received',
  mail_sent: 'Mail Sent',
  mail_received: 'Mail Received',
  court_filing: 'Court Filing',
  document_served: 'Document Served',
  motion_filed: 'Motion Filed',
  legal_demand: 'Legal Demand',
  order_received: 'Court Order Received',
  research_update: 'Research Update',
  action_taken: 'Action Taken',
  strategy_discussion: 'Strategy Discussion',
  other: 'Other',
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  internal_note: 'bg-gray-100 text-gray-700',
  phone_call: 'bg-blue-100 text-blue-700',
  voicemail: 'bg-indigo-100 text-indigo-700',
  email_sent: 'bg-green-100 text-green-700',
  email_received: 'bg-teal-100 text-teal-700',
  mail_sent: 'bg-sky-100 text-sky-700',
  mail_received: 'bg-cyan-100 text-cyan-700',
  court_filing: 'bg-rose-100 text-rose-700',
  document_served: 'bg-amber-100 text-amber-700',
  motion_filed: 'bg-red-100 text-red-700',
  legal_demand: 'bg-fuchsia-100 text-fuchsia-700',
  order_received: 'bg-violet-100 text-violet-700',
  research_update: 'bg-purple-100 text-purple-700',
  action_taken: 'bg-orange-100 text-orange-700',
  strategy_discussion: 'bg-yellow-100 text-yellow-700',
  other: 'bg-gray-100 text-gray-600',
};

interface MemberOption {
  userId: string;
  email: string;
  displayName: string | null;
}

const CASE_TYPE_LABELS: Record<string, string> = {
  code_violation: 'Code Violation',
  collections: 'Collections',
  conciliation: 'Conciliation',
  contract_dispute: 'Contract Dispute',
  eviction: 'Eviction',
  personal_injury: 'Personal Injury',
  property_damage: 'Property Damage',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  stayed: 'bg-yellow-100 text-yellow-800',
  settled: 'bg-green-100 text-green-800',
  judgment: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const COURT_DATE_TYPES: Record<string, string> = {
  hearing: 'Hearing',
  trial: 'Trial',
  motion: 'Motion',
  status_conference: 'Status Conference',
  pretrial_conference: 'Pretrial Conference',
  mediation: 'Mediation',
  settlement_conference: 'Settlement Conference',
  arraignment: 'Arraignment',
  sentencing: 'Sentencing',
  other: 'Other',
};

const COURT_DATE_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  continued: 'bg-yellow-100 text-yellow-700',
  rescheduled: 'bg-orange-100 text-orange-700',
};

const COURT_DATE_STATUSES: Record<string, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  continued: 'Continued',
  rescheduled: 'Rescheduled',
};

const COURT_DATE_OUTCOMES: Record<string, string> = {
  continued: 'Continued',
  dismissed: 'Dismissed',
  dismissed_with_prejudice: 'Dismissed with Prejudice',
  dismissed_without_prejudice: 'Dismissed without Prejudice',
  judgment_plaintiff: 'Judgment for Plaintiff',
  judgment_defendant: 'Judgment for Defendant',
  default_judgment: 'Default Judgment',
  settled: 'Settled',
  stipulation: 'Stipulation',
  motion_granted: 'Motion Granted',
  motion_denied: 'Motion Denied',
  taken_under_advisement: 'Taken Under Advisement',
  other: 'Other',
};

const RESOLUTION_TYPES: Record<string, string> = {
  settlement: 'Settlement',
  judgment_plaintiff: 'Judgment for Plaintiff',
  judgment_defendant: 'Judgment for Defendant',
  default_judgment: 'Default Judgment',
  dismissal: 'Dismissal',
  voluntary_dismissal: 'Voluntary Dismissal',
  other: 'Other',
};

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  // Parse as local date to avoid timezone shift
  const dateStr = iso.substring(0, 10); // Get YYYY-MM-DD portion
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return '—';
  return new Date(year, month - 1, day).toLocaleDateString();
}

function formatTime(time: string | undefined): string {
  if (!time) return '';
  // Handle 24-hour format (HH:MM) from time input
  const parts = time.split(':');
  if (parts.length < 2) return time;
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes}${ampm}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function normalizeOpposingParty(val: OpposingPartyData[] | OpposingPartyData | undefined): OpposingPartyData[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function normalizeOpposingCounsel(val: CounselData[] | CounselData | undefined): CounselData[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function normalizeOurCounsel(val: CounselData[] | CounselData | string | undefined): CounselData[] {
  if (!val) return [];
  if (typeof val === 'string') return val ? [{ name: val }] : [];
  if (Array.isArray(val)) return val;
  return [val];
}

interface CaseDetailPageProps {
  params: Promise<{ llcId: string; caseId: string }>;
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { llcId, caseId } = use(params);
  const router = useRouter();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [courtDates, setCourtDates] = useState<CourtDate[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Damages sought inline edit state
  const [editingDamages, setEditingDamages] = useState(false);
  const [damagesInput, setDamagesInput] = useState('');
  const [savingDamages, setSavingDamages] = useState(false);

  // Court date form state
  const [showCourtDateForm, setShowCourtDateForm] = useState(false);
  const [editingCourtDateId, setEditingCourtDateId] = useState<string | null>(null);
  const [courtDateType, setCourtDateType] = useState('hearing');
  const [courtDateDate, setCourtDateDate] = useState('');
  const [courtDateTime, setCourtDateTime] = useState('');
  const [courtDateJudge, setCourtDateJudge] = useState('');
  const [courtDateCourtroom, setCourtDateCourtroom] = useState('');
  const [courtDateDescription, setCourtDateDescription] = useState('');
  const [courtDateStatus, setCourtDateStatus] = useState('scheduled');
  const [courtDateOutcome, setCourtDateOutcome] = useState('');
  const [courtDateOutcomeNotes, setCourtDateOutcomeNotes] = useState('');
  const [savingCourtDate, setSavingCourtDate] = useState(false);

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Activity state
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [activityFormType, setActivityFormType] = useState('internal_note');
  const [activityFormDescription, setActivityFormDescription] = useState('');
  const [activityFormVisibility, setActivityFormVisibility] = useState('internal');
  const [savingActivity, setSavingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityDescription, setEditingActivityDescription] = useState('');
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);
  const activitiesFetchedRef = useRef(false);

  // Ref for court dates section
  const courtDatesSectionRef = useRef<HTMLDivElement>(null);

  const handleQuickAddCourtDate = () => {
    // Reset to ensure we're in "add" mode, not "edit" mode
    setEditingCourtDateId(null);
    setCourtDateType('hearing');
    setCourtDateDate('');
    setCourtDateTime('');
    setCourtDateJudge('');
    setCourtDateCourtroom('');
    setCourtDateDescription('');
    setCourtDateStatus('scheduled');
    setCourtDateOutcome('');
    setCourtDateOutcomeNotes('');
    setShowCourtDateForm(true);
    // Scroll to the court dates section after a brief delay to allow the form to render
    setTimeout(() => {
      courtDatesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/activities`);
      const json = await res.json();
      if (json.ok) setActivities(json.data);
    } catch {
      // silently fail
    } finally {
      setLoadingActivities(false);
    }
  }, [llcId, caseId]);

  // Lazy-load activities when section is first expanded
  useEffect(() => {
    if (activityExpanded && !activitiesFetchedRef.current) {
      activitiesFetchedRef.current = true;
      fetchActivities();
    }
  }, [activityExpanded, fetchActivities]);

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormDescription.trim()) return;

    setSavingActivity(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: activityFormType,
          description: activityFormDescription.trim(),
          visibility: activityFormVisibility,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setActivities(prev => [data.data, ...prev]);
        setActivityFormType('internal_note');
        setActivityFormDescription('');
        setActivityFormVisibility('internal');
        setShowActivityForm(false);
        setActivityExpanded(true);
        activitiesFetchedRef.current = true;
      } else {
        alert(data.error?.message || 'Failed to log activity');
      }
    } catch {
      alert('Failed to log activity');
    } finally {
      setSavingActivity(false);
    }
  };

  const handleUpdateActivity = async (activityId: string) => {
    if (!editingActivityDescription.trim()) return;

    setUpdatingActivityId(activityId);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editingActivityDescription.trim() }),
      });

      const data = await res.json();
      if (data.ok) {
        setActivities(prev => prev.map(a => a.id === activityId ? data.data : a));
        setEditingActivityId(null);
        setEditingActivityDescription('');
      } else {
        alert(data.error?.message || 'Failed to update activity');
      }
    } catch {
      alert('Failed to update activity');
    } finally {
      setUpdatingActivityId(null);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/activities/${activityId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        setActivities(prev => prev.filter(a => a.id !== activityId));
      } else {
        alert(data.error?.message || 'Failed to delete activity');
      }
    } catch {
      alert('Failed to delete activity');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const [caseRes, tasksRes, docsRes, courtDatesRes, membersRes, feesRes] = await Promise.all([
        fetch(`/api/llcs/${llcId}/cases/${caseId}`),
        fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks`),
        fetch(`/api/llcs/${llcId}/cases/${caseId}/documents`),
        fetch(`/api/llcs/${llcId}/cases/${caseId}/court-dates`),
        fetch(`/api/llcs/${llcId}/members`),
        fetch(`/api/llcs/${llcId}/cases/${caseId}/fees`),
      ]);

      const [caseJson, tasksJson, docsJson, courtDatesJson, membersJson, feesJson] = await Promise.all([
        caseRes.json(),
        tasksRes.json(),
        docsRes.json(),
        courtDatesRes.json(),
        membersRes.json(),
        feesRes.json(),
      ]);

      if (caseJson.ok) setCaseData(caseJson.data);
      else setError(caseJson.error?.message || 'Failed to load case');

      if (tasksJson.ok) setTasks(tasksJson.data);
      if (docsJson.ok) setDocuments(docsJson.data);
      if (courtDatesJson.ok) setCourtDates(courtDatesJson.data);
      if (membersJson.ok) setMembers(membersJson.data);
      if (feesJson.ok) setFees(feesJson.data);
    } catch {
      setError('Failed to load case data');
    } finally {
      setLoading(false);
    }
  }, [llcId, caseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDamages = async () => {
    const cents = Math.round(parseFloat(damagesInput.replace(/,/g, '')) * 100);
    if (isNaN(cents) || cents < 0) return;
    setSavingDamages(true);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ damagesSoughtCents: cents }),
      });
      const data = await res.json();
      if (data.ok) {
        setCaseData((prev) => prev ? { ...prev, damagesSoughtCents: cents } : prev);
        setEditingDamages(false);
      } else {
        alert(data.error?.message || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    } finally {
      setSavingDamages(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this case? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.ok) {
        router.push(`/llcs/${llcId}/legal`);
      } else {
        alert(data.error?.message || 'Failed to delete case');
      }
    } catch {
      alert('Failed to delete case');
    }
  };

  const getMemberName = (userId: string): string => {
    const member = members.find(m => m.userId === userId);
    return member?.displayName || member?.email || userId;
  };

  // Document handlers
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError('');

    try {
      // 1. Get upload URL
      const urlRes = await fetch(`/api/llcs/${llcId}/cases/${caseId}/documents/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.name,
          contentType: uploadFile.type,
          sizeBytes: uploadFile.size,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlData.ok) {
        throw new Error(urlData.error?.message || 'Failed to get upload URL');
      }

      // 2. Upload to Storage
      const uploadRes = await fetch(urlData.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type },
        body: uploadFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      // 3. Create document record
      const docRes = await fetch(`/api/llcs/${llcId}/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: uploadType,
          title: uploadTitle || uploadFile.name,
          description: uploadDescription.trim() || undefined,
          fileName: uploadFile.name,
          storagePath: urlData.data.storagePath,
          contentType: uploadFile.type,
          sizeBytes: uploadFile.size,
        }),
      });

      const docData = await docRes.json();
      if (!docData.ok) {
        throw new Error(docData.error?.message || 'Failed to create document record');
      }

      // Reset form and refresh
      setUploadFile(null);
      setUploadType('other');
      setUploadTitle('');
      setUploadDescription('');
      setShowUploadForm(false);
      fetchData();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    setDownloadingId(documentId);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/documents/${documentId}`);
      const data = await res.json();

      if (data.ok && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
      } else {
        alert(data.error?.message || 'Failed to get download URL');
      }
    } catch {
      alert('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        fetchData();
      } else {
        alert(data.error?.message || 'Failed to delete document');
      }
    } catch {
      alert('Failed to delete document');
    }
  };

  // Court date handlers
  const resetCourtDateForm = () => {
    setCourtDateType('hearing');
    setCourtDateDate('');
    setCourtDateTime('');
    setCourtDateJudge('');
    setCourtDateCourtroom('');
    setCourtDateDescription('');
    setCourtDateStatus('scheduled');
    setCourtDateOutcome('');
    setCourtDateOutcomeNotes('');
    setEditingCourtDateId(null);
    setShowCourtDateForm(false);
  };

  const handleEditCourtDate = (cd: CourtDate) => {
    setEditingCourtDateId(cd.id);
    setCourtDateType(cd.type);
    setCourtDateDate(cd.date);
    setCourtDateTime(cd.time || '');
    setCourtDateJudge(cd.judge || '');
    setCourtDateCourtroom(cd.courtroom || '');
    setCourtDateDescription(cd.description || '');
    setCourtDateStatus(cd.status);
    setCourtDateOutcome(cd.outcome || '');
    setCourtDateOutcomeNotes(cd.outcomeNotes || '');
    setShowCourtDateForm(true);
    // Scroll to form
    setTimeout(() => {
      courtDatesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveCourtDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtDateDate) return;

    setSavingCourtDate(true);
    try {
      const isEditing = !!editingCourtDateId;
      const url = isEditing
        ? `/api/llcs/${llcId}/cases/${caseId}/court-dates/${editingCourtDateId}`
        : `/api/llcs/${llcId}/cases/${caseId}/court-dates`;

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: courtDateType,
          date: courtDateDate,
          time: courtDateTime || undefined,
          judge: courtDateJudge || undefined,
          courtroom: courtDateCourtroom || undefined,
          description: courtDateDescription || undefined,
          status: courtDateStatus,
          outcome: courtDateOutcome || undefined,
          outcomeNotes: courtDateOutcomeNotes || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        resetCourtDateForm();
        fetchData();
      } else {
        alert(data.error?.message || `Failed to ${isEditing ? 'update' : 'add'} court date`);
      }
    } catch {
      alert(`Failed to ${editingCourtDateId ? 'update' : 'add'} court date`);
    } finally {
      setSavingCourtDate(false);
    }
  };

  const handleDeleteCourtDate = async (courtDateId: string) => {
    if (!confirm('Are you sure you want to delete this court date?')) return;

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/court-dates/${courtDateId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.ok) {
        fetchData();
      } else {
        alert(data.error?.message || 'Failed to delete court date');
      }
    } catch {
      alert('Failed to delete court date');
    }
  };

  const handleMarkCourtDateComplete = async (courtDateId: string) => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/court-dates/${courtDateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const data = await res.json();
      if (data.ok) {
        fetchData();
      } else {
        alert(data.error?.message || 'Failed to update court date');
      }
    } catch {
      alert('Failed to update court date');
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
        setSelectedTask(null);
      } else {
        alert(data.error?.message || 'Failed to update task');
      }
    } catch {
      alert('Failed to update task');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Separate upcoming and past court dates
  const today = new Date().toISOString().split('T')[0] || '';
  const upcomingCourtDates = courtDates.filter(cd => cd.date >= today && cd.status === 'scheduled');
  const pastCourtDates = courtDates.filter(cd => cd.date < today || cd.status !== 'scheduled');

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-secondary rounded w-1/3"></div>
        <div className="h-32 bg-secondary rounded"></div>
        <div className="h-48 bg-secondary rounded"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || 'Case not found'}</p>
        <Link href={`/llcs/${llcId}/legal`} className="text-primary hover:underline">
          Back to Cases
        </Link>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {/* Docket number on its own row */}
          <p className="font-bold">
            {caseData.plaintiff?.type === 'llc' ? caseData.plaintiff.llcName : caseData.plaintiff?.name} <br/>v. {Array.isArray(caseData.opposingParty) ? caseData.opposingParty.map(op => op.name || op.tenantName).join(', ') : caseData.opposingParty?.name || caseData.opposingParty?.tenantName || 'Unknown Opposing Party'}
          </p>
          {/* Docket number on its own row */}
          <h3 className="text-2xl font-bold">
            {caseData.docketNumber || `${CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType} Case`}
          </h3>
          {/* Status below docket, left-aligned */}
          <div className="mt-1 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[caseData.status] || 'bg-gray-100'}`}>
              {caseData.status}
            </span>
          </div>
          {/* Court and jurisdiction on its own row */}
          <p className="text-muted-foreground">
            {caseData.court} &bull; {caseData.jurisdiction}
          </p>
        </div>
        {/* Edit and Delete - right aligned, own row on mobile */}
        <div className="flex items-center gap-2 justify-end">
          <Link
            href={`/llcs/${llcId}/legal/${caseId}/edit`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            Edit Case
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Case Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Dates Alert */}
          {caseData.nextHearingDate && (
            <div className={`p-4 rounded-lg border ${getDaysUntil(caseData.nextHearingDate) <= 7 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-medium">Next Hearing: {formatDate(caseData.nextHearingDate)}</p>
                  <p className="text-sm text-muted-foreground">
                    {getDaysUntil(caseData.nextHearingDate)} days from now
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Damages Sought */}
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Damages Sought</h2>
              {!editingDamages && (
                <button
                  onClick={() => {
                    setDamagesInput(caseData.damagesSoughtCents != null ? (caseData.damagesSoughtCents / 100).toFixed(2) : '');
                    setEditingDamages(true);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {caseData.damagesSoughtCents != null ? 'Edit' : 'Set amount'}
                </button>
              )}
            </div>
            {editingDamages ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={damagesInput}
                  onChange={(e) => setDamagesInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDamages(); if (e.key === 'Escape') setEditingDamages(false); }}
                  autoFocus
                  className="w-44 px-3 py-1.5 border rounded-md bg-background text-sm"
                  placeholder="0.00"
                />
                <button
                  onClick={handleSaveDamages}
                  disabled={savingDamages}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:opacity-90 disabled:opacity-50"
                >
                  {savingDamages ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingDamages(false)}
                  className="px-3 py-1.5 border rounded-md text-xs hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-3xl font-bold mt-1">
                {caseData.damagesSoughtCents != null
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(caseData.damagesSoughtCents / 100)
                  : <span className="text-muted-foreground text-base font-normal">Not set</span>}
              </p>
            )}
          </div>

          {/* Case Information */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Case Information</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Case Type</dt>
                <dd className="font-medium">{CASE_TYPE_LABELS[caseData.caseType] || caseData.caseType}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Docket Number</dt>
                <dd className="font-medium">{caseData.docketNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Filing Date</dt>
                <dd className="font-medium">{formatDate(caseData.filingDate)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Visibility</dt>
                <dd className="font-medium capitalize">{caseData.visibility === 'llcWide' ? 'LLC-Wide' : 'Restricted'}</dd>
              </div>
            </dl>
            {caseData.description && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-muted-foreground text-sm mb-1">Description</dt>
                <dd className="text-sm whitespace-pre-wrap">{caseData.description}</dd>
              </div>
            )}
            {caseData.tags && caseData.tags.length > 0 && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                {caseData.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-secondary rounded text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Parties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plaintiff */}
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Plaintiff</h3>
                {caseData.plaintiff ? (
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <p className="font-medium">
                      {caseData.plaintiff.type === 'llc' ? caseData.plaintiff.llcName : caseData.plaintiff.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{caseData.plaintiff.type}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>

              {/* Opposing Parties */}
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Opposing {normalizeOpposingParty(caseData.opposingParty).length === 1 ? 'Party' : 'Parties'}</h3>
                {normalizeOpposingParty(caseData.opposingParty).length > 0 ? (
                  <div className="space-y-2">
                    {normalizeOpposingParty(caseData.opposingParty).map((op, idx) => (
                      <div key={idx} className="p-3 bg-secondary/30 rounded-md space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {op.type === 'tenant' ? op.tenantName : op.name}
                          </p>
                          {op.type === 'other' && op.entityType && (
                            <span className="text-xs px-1.5 py-0.5 bg-secondary rounded capitalize text-muted-foreground leading-none">
                              {op.entityType}
                            </span>
                          )}
                          {op.type === 'tenant' && (
                            <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground leading-none">
                              tenant
                            </span>
                          )}
                        </div>
                        {op.propertyAddress && (
                          <p className="text-xs text-muted-foreground">{op.propertyAddress}</p>
                        )}
                        {(op.phone || op.email) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                            {op.phone && (
                              <span className="text-xs text-foreground/70">{op.phone}</span>
                            )}
                            {op.email && (
                              <span className="text-xs text-foreground/70">{op.email}</span>
                            )}
                          </div>
                        )}
                        {op.address && (
                          <p className="text-xs text-muted-foreground">
                            {op.address.street1}, {op.address.city}, {op.address.state} {op.address.zipCode}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Counsel */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Counsel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Our Counsel */}
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Our Counsel</h3>
                {normalizeOurCounsel(caseData.ourCounsel).length > 0 ? (
                  <div className="space-y-2">
                    {normalizeOurCounsel(caseData.ourCounsel).map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="font-medium">{c.name}</p>
                        {c.firmName && (
                          <p className="text-sm text-muted-foreground">{c.firmName}</p>
                        )}
                        {c.email && (
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        )}
                        {c.phone && (
                          <p className="text-sm text-muted-foreground">{c.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>

              {/* Opposing Counsel */}
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Opposing Counsel</h3>
                {normalizeOpposingCounsel(caseData.opposingCounsel).length > 0 ? (
                  <div className="space-y-2">
                    {normalizeOpposingCounsel(caseData.opposingCounsel).map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="font-medium">{c.name}</p>
                        {c.firmName && (
                          <p className="text-sm text-muted-foreground">{c.firmName}</p>
                        )}
                        {c.email && (
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        )}
                        {c.phone && (
                          <p className="text-sm text-muted-foreground">{c.phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Resolution (if case is resolved) */}
          {caseData.resolution && (
            <div className="border rounded-lg p-5 bg-green-50 border-green-200">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Case Resolution
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Resolution Type</dt>
                  <dd className="font-medium">{RESOLUTION_TYPES[caseData.resolution.type] || caseData.resolution.type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Resolution Date</dt>
                  <dd className="font-medium">{formatDate(caseData.resolution.date)}</dd>
                </div>
                {caseData.resolution.amount !== undefined && caseData.resolution.amount > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-medium">${(caseData.resolution.amount / 100).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
              {caseData.resolution.terms && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <dt className="text-muted-foreground text-sm mb-1">Terms</dt>
                  <dd className="text-sm whitespace-pre-wrap">{caseData.resolution.terms}</dd>
                </div>
              )}
              {caseData.resolution.notes && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <dt className="text-muted-foreground text-sm mb-1">Notes</dt>
                  <dd className="text-sm whitespace-pre-wrap">{caseData.resolution.notes}</dd>
                </div>
              )}
            </div>
          )}

          {/* Court Dates Section */}
          <div ref={courtDatesSectionRef} className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Court Dates ({upcomingCourtDates.length} upcoming)</h2>
              <button
                onClick={() => showCourtDateForm ? resetCourtDateForm() : handleQuickAddCourtDate()}
                className="text-sm text-primary hover:underline"
              >
                {showCourtDateForm ? 'Cancel' : '+ Add Court Date'}
              </button>
            </div>

            {/* Add/Edit Court Date Form */}
            {showCourtDateForm && (
              <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
                <h3 className="text-sm font-medium mb-3">
                  {editingCourtDateId ? 'Update Court Date' : 'Add Court Date'}
                </h3>
                <form onSubmit={handleSaveCourtDate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={courtDateType}
                        onChange={(e) => setCourtDateType(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      >
                        {Object.entries(COURT_DATE_TYPES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Date *</label>
                      <input
                        type="date"
                        value={courtDateDate}
                        onChange={(e) => setCourtDateDate(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Time</label>
                      <input
                        type="time"
                        value={courtDateTime}
                        onChange={(e) => setCourtDateTime(e.target.value)}
                        placeholder="9:00 AM"
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Judge</label>
                      <input
                        type="text"
                        value={courtDateJudge}
                        onChange={(e) => setCourtDateJudge(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Courtroom</label>
                      <input
                        type="text"
                        value={courtDateCourtroom}
                        onChange={(e) => setCourtDateCourtroom(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Description</label>
                    <textarea
                      value={courtDateDescription}
                      onChange={(e) => {
                        setCourtDateDescription(e.target.value)
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="What this appearance is for..."
                      rows={1}
                      className="w-full px-2 py-1.5 border rounded text-sm bg-background resize-none overflow-hidden"
                    />
                  </div>

                  {/* Status and Outcome - shown when editing or for completed dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Status</label>
                      <select
                        value={courtDateStatus}
                        onChange={(e) => setCourtDateStatus(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      >
                        {Object.entries(COURT_DATE_STATUSES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Outcome</label>
                      <select
                        value={courtDateOutcome}
                        onChange={(e) => setCourtDateOutcome(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      >
                        <option value="">-- No outcome yet --</option>
                        {Object.entries(COURT_DATE_OUTCOMES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {courtDateOutcome && (
                    <div>
                      <label className="block text-xs font-medium mb-1">Outcome Notes</label>
                      <textarea
                        value={courtDateOutcomeNotes}
                        onChange={(e) => setCourtDateOutcomeNotes(e.target.value)}
                        placeholder="Details about what happened..."
                        rows={2}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!courtDateDate || savingCourtDate}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {savingCourtDate
                        ? (editingCourtDateId ? 'Updating...' : 'Adding...')
                        : (editingCourtDateId ? 'Update Court Date' : 'Add Court Date')}
                    </button>
                    <button
                      type="button"
                      onClick={resetCourtDateForm}
                      className="px-3 py-1.5 border rounded text-sm hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {courtDates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No court dates scheduled</p>
            ) : (
              <div className="space-y-3">
                {/* Upcoming court dates */}
                {upcomingCourtDates.map(cd => (
                  <div key={cd.id} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{COURT_DATE_TYPES[cd.type] || cd.type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${COURT_DATE_STATUS_COLORS[cd.status]}`}>
                          {cd.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(cd.date)}{cd.time && ` at ${formatTime(cd.time)} (CDT)`}<br/>
                        {cd.judge && `Judge ${cd.judge}`}<br/>
                        {cd.courtroom && `Room ${cd.courtroom}`}<br/>
                      </p>
                      {cd.description && (
                        <p className="text-xs text-muted-foreground mt-1">{cd.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCourtDate(cd)}
                        className="text-xs text-primary hover:underline"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleMarkCourtDateComplete(cd.id)}
                        className="text-xs text-green-600 hover:underline"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleDeleteCourtDate(cd.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Past/completed court dates */}
                {pastCourtDates.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      {pastCourtDates.length} past court date{pastCourtDates.length !== 1 ? 's' : ''}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {pastCourtDates.map(cd => (
                        <div key={cd.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md opacity-70">
                          <div className="text-muted-foreground mt-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{COURT_DATE_TYPES[cd.type] || cd.type}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${COURT_DATE_STATUS_COLORS[cd.status]}`}>
                                {cd.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(cd.date)}{cd.time && ` at ${formatTime(cd.time)} (CDT)`}
                            </p>
                            {cd.outcome && (
                              <p className="text-xs mt-1">
                                <span className="text-muted-foreground">Outcome:</span> {COURT_DATE_OUTCOMES[cd.outcome] || cd.outcome.replace(/_/g, ' ')}
                              </p>
                            )}
                            {cd.outcomeNotes && (
                              <p className="text-xs text-muted-foreground mt-1">{cd.outcomeNotes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCourtDate(cd)}
                              className="text-xs text-primary hover:underline"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteCourtDate(cd.id)}
                              className="text-xs text-destructive hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Tasks ({pendingTasks.length} active)</h2>
              <Link
                href={`/llcs/${llcId}/legal/${caseId}/tasks`}
                className="text-sm text-primary hover:underline"
              >
                Manage Tasks
              </Link>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="flex items-start gap-3 p-3 bg-secondary/30 rounded-md w-full text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`mt-0.5 ${PRIORITY_COLORS[task.priority]}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {task.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${TASK_STATUS_COLORS[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(task.dueDate)}
                        {task.assignedToUserId && ` • Assigned to ${getMemberName(task.assignedToUserId)}`}
                      </p>
                    </div>
                  </button>
                ))}

                {completedTasks.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''}
                    </summary>
                    <div className="mt-2 space-y-2 opacity-60">
                      {completedTasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center gap-2 p-2 text-sm w-full text-left hover:opacity-80"
                        >
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="line-through">{task.title}</span>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Documents ({documents.length})</h2>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
              <div className="mb-4 p-4 bg-secondary/30 rounded-lg">
                <form onSubmit={handleUpload} className="space-y-3">
                  {uploadError && (
                    <div className="p-2 bg-destructive/10 text-destructive rounded text-sm">
                      {uploadError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Title (optional)</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                        placeholder="Document title"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                      placeholder="Brief description of the document"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">File</label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, or images</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-md">
                    <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {doc.type.replace(/_/g, ' ')} &bull; {formatBytes(doc.sizeBytes)} &bull; {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        disabled={downloadingId === doc.id}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        {downloadingId === doc.id ? 'Loading...' : 'Download'}
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case Activity Section */}
          <div className="border rounded-lg p-5">
            <button
              onClick={() => setActivityExpanded(!activityExpanded)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="font-semibold flex items-center gap-2">
                Case Activity
                {activities.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-secondary rounded-full text-xs font-normal">
                    {activities.length}
                  </span>
                )}
              </h2>
              <svg
                className={`w-5 h-5 text-muted-foreground transition-transform ${activityExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activityExpanded && (
              <div className="mt-4 space-y-3">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search activities..."
                    className="flex-1 px-3 py-1.5 border rounded text-sm bg-background"
                  />
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="px-3 py-1.5 border rounded text-sm bg-background"
                  >
                    <option value="">All Types</option>
                    {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {loadingActivities ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activities logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {activities
                      .filter(a => {
                        if (activityTypeFilter && a.activityType !== activityTypeFilter) return false;
                        if (activitySearch && !a.description.toLowerCase().includes(activitySearch.toLowerCase())) return false;
                        return true;
                      })
                      .map(activity => (
                        <div key={activity.id} className="p-3 bg-secondary/30 rounded-md">
                          {editingActivityId === activity.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingActivityDescription}
                                onChange={(e) => setEditingActivityDescription(e.target.value)}
                                rows={3}
                                className="w-full px-2 py-1.5 border rounded text-sm bg-background"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateActivity(activity.id)}
                                  disabled={updatingActivityId === activity.id}
                                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:opacity-90 disabled:opacity-50"
                                >
                                  {updatingActivityId === activity.id ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => { setEditingActivityId(null); setEditingActivityDescription(''); }}
                                  className="px-3 py-1 border rounded text-xs hover:bg-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ACTIVITY_TYPE_COLORS[activity.activityType] || 'bg-gray-100 text-gray-700'}`}>
                                    {ACTIVITY_TYPES[activity.activityType] || activity.activityType}
                                  </span>
                                  {activity.visibility === 'internal' && (
                                    <span className="text-xs text-muted-foreground">Internal</span>
                                  )}
                                  {activity.editHistory && activity.editHistory.length > 0 && (
                                    <span className="text-xs text-muted-foreground italic">edited</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingActivityId(activity.id);
                                      setEditingActivityDescription(activity.description);
                                    }}
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
                              <p className="text-sm mt-1 whitespace-pre-wrap">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getMemberName(activity.createdByUserId)} &bull; {formatRelativeTime(activity.createdAt)}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleQuickAddCourtDate}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add Court Date
              </button>
              <button
                onClick={() => setShowActivityForm(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Log Activity
              </button>
              <Link
                href={`/llcs/${llcId}/legal/${caseId}/tasks`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </Link>
              <Link
                href={`/llcs/${llcId}/legal/${caseId}/documents`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Documents
              </Link>
              <Link
                href={`/llcs/${llcId}/legal/${caseId}/fees`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Legal Fees
              </Link>
              <Link
                href={`/llcs/${llcId}/legal/${caseId}/edit`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Case
              </Link>
            </div>
          </div>

          {/* Case Managers */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Case Managers</h2>
            {caseData.caseManagers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No managers assigned</p>
            ) : (
              <div className="space-y-2">
                {caseData.caseManagers.map(userId => (
                  <div key={userId} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{getMemberName(userId)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border rounded-lg p-5">
            <h2 className="font-semibold mb-4">Timeline</h2>
            <div className="space-y-4 text-sm">
              {caseData.nextHearingDate && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-400"></div>
                  <div>
                    <p className="font-medium">Next Hearing</p>
                    <p className="text-muted-foreground">{formatDate(caseData.nextHearingDate)}</p>
                  </div>
                </div>
              )}
              {caseData.filingDate && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium">Filed</p>
                    <p className="text-muted-foreground">{formatDate(caseData.filingDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-400"></div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">{formatDate(caseData.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Fees */}
          <div className="border rounded-lg p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Legal Fees</h2>
              <span className="text-lg font-semibold tabular-nums">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  fees.reduce((sum, f) => sum + f.amountCents, 0) / 100
                )}
              </span>
            </div>
            {fees.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-3">No fees recorded.</p>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {fees.slice(0, 5).map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 flex-1">
                        <span className="truncate block text-foreground">{fee.description}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(fee.date)}</span>
                      </div>
                      <span className="ml-3 tabular-nums font-medium shrink-0">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fee.amountCents / 100)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/llcs/${llcId}/legal/${caseId}/fees`}
                  className="mt-4 block text-center text-xs text-primary hover:underline"
                >
                  {fees.length > 5 ? `View all ${fees.length} fees` : 'View fees'}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedTask(null)} />
          <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-medium">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Due Date</dt>
                  <dd className={`font-medium ${
                    selectedTask.status !== 'completed' && selectedTask.status !== 'canceled' && new Date(selectedTask.dueDate) < new Date()
                      ? 'text-red-600' : ''
                  }`}>
                    {formatDate(selectedTask.dueDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Priority</dt>
                  <dd className={`font-medium capitalize ${PRIORITY_COLORS[selectedTask.priority]}`}>
                    {selectedTask.priority}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs mb-0.5">Status</dt>
                  <dd>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TASK_STATUS_COLORS[selectedTask.status]}`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                {selectedTask.assignedToUserId && (
                  <div>
                    <dt className="text-muted-foreground text-xs mb-0.5">Assigned To</dt>
                    <dd className="font-medium">{getMemberName(selectedTask.assignedToUserId)}</dd>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t">
                {selectedTask.status !== 'completed' ? (
                  <button
                    onClick={() => handleTaskStatusChange(selectedTask.id, 'completed')}
                    disabled={updatingTaskId === selectedTask.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    {updatingTaskId === selectedTask.id ? 'Updating...' : 'Mark Complete'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleTaskStatusChange(selectedTask.id, 'pending')}
                    disabled={updatingTaskId === selectedTask.id}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm disabled:opacity-50"
                  >
                    {updatingTaskId === selectedTask.id ? 'Updating...' : 'Reopen Task'}
                  </button>
                )}
                <Link
                  href={`/llcs/${llcId}/legal/${caseId}/tasks`}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-secondary"
                >
                  Edit in Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Log Activity Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowActivityForm(false)} />
          <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Log Activity</h2>
              <button
                onClick={() => setShowActivityForm(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveActivity} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Activity Type</label>
                <select
                  value={activityFormType}
                  onChange={(e) => setActivityFormType(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm bg-background"
                >
                  {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={activityFormDescription}
                  onChange={(e) => setActivityFormDescription(e.target.value)}
                  rows={4}
                  placeholder="What happened..."
                  className="w-full px-3 py-2 border rounded text-sm bg-background resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <select
                  value={activityFormVisibility}
                  onChange={(e) => setActivityFormVisibility(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm bg-background"
                >
                  <option value="internal">Internal Only</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!activityFormDescription.trim() || savingActivity}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm disabled:opacity-50"
                >
                  {savingActivity ? 'Saving...' : 'Log Activity'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivityForm(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
