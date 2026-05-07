'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  aocStep1Schema,
  aocStep2Schema,
  aocStep3Schema,
  AssignmentOfClaim,
  AocExhibitKey,
  AOC_EXHIBIT_DEFINITIONS,
  ASSIGNMENT_CLAIM_TYPE_LABELS,
  User,
  OpposingPartyTenant,
} from '@shared/types';
import { generateAocDocument, generateNoticeToObligor } from '@shared/assignmentOfClaim/generator';

interface DocumentAnalysis {
  fileName: string;
  documentType:
    | 'lease'
    | 'tenant_ledger'
    | 'correspondence'
    | 'eviction_notice'
    | 'invoice'
    | 'insurance'
    | 'other';
  summary: string;
  parties: { name: string; role: string }[];
  keyAmounts: { description: string; amount: string }[];
  keyDates: { description: string; date: string }[];
  suggestedFields: {
    tenantName?: string;
    propertyAddress?: string;
    claimType?: 'rent_debt' | 'insurance_claim' | 'general_monetary';
    claimValueDollars?: string;
  };
}

interface AnalysisResult {
  claimDescription: string;
  documents: DocumentAnalysis[];
}

const DOC_TYPE_LABELS: Record<DocumentAnalysis['documentType'], string> = {
  lease: 'Lease',
  tenant_ledger: 'Tenant Ledger',
  correspondence: 'Correspondence',
  eviction_notice: 'Eviction Notice',
  invoice: 'Invoice',
  insurance: 'Insurance',
  other: 'Other',
};

const DOC_TYPE_COLORS: Record<DocumentAnalysis['documentType'], string> = {
  lease: 'bg-blue-100 text-blue-800',
  tenant_ledger: 'bg-purple-100 text-purple-800',
  correspondence: 'bg-yellow-100 text-yellow-800',
  eviction_notice: 'bg-red-100 text-red-800',
  invoice: 'bg-orange-100 text-orange-800',
  insurance: 'bg-green-100 text-green-800',
  other: 'bg-secondary text-muted-foreground',
};

interface ObligorEntry {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface NewAssignmentPageProps {
  params: Promise<{ llcId: string }>;
  searchParams: Promise<{ caseId?: string }>;
}

const TODAY = new Date().toISOString().slice(0, 10);

type WizardState = {
  step: 1 | 2 | 3 | 4;
  caseId: string;
  caseLabel: string; // docketNumber or caseType for the banner
  // Step 1
  claimType: string;
  claimDescription: string;
  claimValueDollars: string;
  obligors: ObligorEntry[];
  propertyStreet: string;
  propertyUnit: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  insuranceClaimNumber: string;
  insurer: string;
  // Step 2
  assigneeName: string;
  assigneeEntityType: 'individual' | 'company';
  assigneeAddress: string;
  assigneePhone: string;
  assigneeEmail: string;
  // Step 3
  considerationDollars: string;
  effectiveDate: string;
  expirationDate: string;
  warrantsGoodTitle: boolean;
  specialConditions: string;
  requiresNotarization: boolean;
  exhibits: AocExhibitKey[];
  assignorSignDigitally: boolean;
  assignorSignatoryName: string;
  assignorTitle: string;
  assigneeSignDigitally: boolean;
  assigneeSignatoryName: string;
  assigneeTitle: string;
  // Step 4 notice
  noticeSignatoryName: string;
  noticeSignedDate: string;
  noticeAddressIndices: number[];
};

const INITIAL: WizardState = {
  step: 1,
  caseId: '',
  caseLabel: '',
  claimType: 'rent_debt',
  claimDescription: '',
  claimValueDollars: '',
  obligors: [],
  propertyStreet: '',
  propertyUnit: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  insuranceClaimNumber: '',
  insurer: '',
  assigneeName: '',
  assigneeEntityType: 'individual',
  assigneeAddress: '',
  assigneePhone: '',
  assigneeEmail: '',
  considerationDollars: '1.00',
  effectiveDate: TODAY,
  expirationDate: '',
  warrantsGoodTitle: true,
  specialConditions: '',
  requiresNotarization: false,
  exhibits: [],
  assignorSignDigitally: false,
  assignorSignatoryName: '',
  assignorTitle: '',
  assigneeSignDigitally: false,
  assigneeSignatoryName: '',
  assigneeTitle: '',
  noticeSignatoryName: '',
  noticeSignedDate: '',
  noticeAddressIndices: [],
};

function dollarsToCents(val: string): number {
  return Math.round(parseFloat(val || '0') * 100);
}

function formatUserAddress(u: User): string {
  if (!u.mailingAddress) return '';
  const { street1, street2, city, state, zipCode } = u.mailingAddress;
  const parts = [street1];
  if (street2) parts.push(street2);
  const csz = [city, [state, zipCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  if (csz) parts.push(csz);
  return parts.join(', ');
}

function buildPropertyAddress(s: WizardState): string | undefined {
  const street = s.propertyStreet.trim();
  if (!street) return undefined;
  const parts = [street];
  if (s.propertyUnit.trim()) parts.push(s.propertyUnit.trim());
  const cityStateZip = [
    s.propertyCity.trim(),
    [s.propertyState.trim().toUpperCase(), s.propertyZip.trim()].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');
  if (cityStateZip) parts.push(cityStateZip);
  return parts.join(', ');
}

function buildPreview(s: WizardState, llcName = 'LLC'): AssignmentOfClaim {
  const primaryObligor = s.obligors.find(o => o.isPrimary) ?? s.obligors[0];
  return {
    id: 'preview',
    llcId: 'preview',
    llcName,
    claimType: s.claimType as AssignmentOfClaim['claimType'],
    claimDescription: s.claimDescription,
    claimValueCents: s.claimValueDollars ? dollarsToCents(s.claimValueDollars) : undefined,
    obligors: s.obligors.length > 0 ? s.obligors.map(o => ({
      name: o.name,
      address: o.address || undefined,
      phone: o.phone || undefined,
      email: o.email || undefined,
      isPrimary: o.isPrimary,
    })) : undefined,
    tenantName: primaryObligor?.name || undefined,
    tenantAddress: primaryObligor?.address || undefined,
    propertyAddress: buildPropertyAddress(s),
    insuranceClaimNumber: s.insuranceClaimNumber || undefined,
    insurer: s.insurer || undefined,
    assignee: {
      name: s.assigneeName,
      entityType: s.assigneeEntityType,
      address: s.assigneeAddress,
      phone: s.assigneePhone || undefined,
      email: s.assigneeEmail || undefined,
    },
    considerationCents: dollarsToCents(s.considerationDollars),
    effectiveDate: s.effectiveDate,
    expirationDate: s.expirationDate || undefined,
    warrantsGoodTitle: s.warrantsGoodTitle,
    specialConditions: s.specialConditions || undefined,
    requiresNotarization: s.requiresNotarization || undefined,
    exhibits: s.exhibits.length > 0 ? s.exhibits : undefined,
    assignorSignatoryName: s.assignorSignDigitally && s.assignorSignatoryName ? s.assignorSignatoryName : undefined,
    assignorTitle: s.assignorSignDigitally && s.assignorTitle ? s.assignorTitle : undefined,
    assigneeSignatoryName: s.assigneeSignDigitally && s.assigneeSignatoryName ? s.assigneeSignatoryName : undefined,
    assigneeTitle: s.assigneeSignDigitally && s.assigneeTitle ? s.assigneeTitle : undefined,
    status: 'draft',
    createdByUserId: '',
    createdAt: { seconds: 0, nanoseconds: 0 },
  };
}

export default function NewAssignmentPage({ params, searchParams }: NewAssignmentPageProps) {
  const { llcId } = use(params);
  const { caseId: caseIdParam } = use(searchParams);
  const router = useRouter();
  const [state, setState] = useState<WizardState>(INITIAL);
  const [caseBannerDismissed, setCaseBannerDismissed] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedAssignees, setSavedAssignees] = useState<User[]>([]);

  // AI Document Analysis
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/assignees')
      .then(r => r.json())
      .then(data => { if (data.ok) setSavedAssignees(data.data); })
      .catch(() => {});
  }, []);

  // Pre-fill from case if caseId searchParam is present
  useEffect(() => {
    if (!caseIdParam) return;
    fetch(`/api/llcs/${llcId}/cases/${caseIdParam}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) return;
        const c = data.data;
        const patch: Partial<WizardState> = {
          caseId: caseIdParam,
          caseLabel: c.docketNumber || c.caseType,
        };
        if (c.description) patch.claimDescription = c.description;
        if (c.damagesSoughtCents != null) {
          patch.claimValueDollars = (c.damagesSoughtCents / 100).toFixed(2);
        }
        // Infer claimType
        if (['eviction', 'conciliation', 'collections'].includes(c.caseType)) {
          patch.claimType = 'rent_debt';
        } else {
          patch.claimType = 'general_monetary';
        }
        // Pre-fill obligors from all tenant opposing parties
        const parties = Array.isArray(c.opposingParty) ? c.opposingParty
          : c.opposingParty ? [c.opposingParty] : [];
        const tenantParties = parties.filter((op: { type: string }) => op.type === 'tenant');
        if (tenantParties.length > 0) {
          patch.obligors = tenantParties.map((op: OpposingPartyTenant, idx: number) => ({
            id: `prefill-${idx}`,
            name: op.tenantName ?? '',
            address: op.propertyAddress ?? '',
            phone: op.phone ?? '',
            email: op.email ?? '',
            isPrimary: idx === 0,
          }));
          const firstTenant = tenantParties[0] as OpposingPartyTenant;
          if (firstTenant?.propertyAddress) patch.propertyStreet = firstTenant.propertyAddress;
        }
        set(patch);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseIdParam, llcId]);

  const set = (patch: Partial<WizardState>) => setState(prev => ({ ...prev, ...patch }));

  const addObligor = () => {
    setState(prev => {
      const newEntry: ObligorEntry = {
        id: Date.now().toString(),
        name: '', address: '', phone: '', email: '',
        isPrimary: prev.obligors.length === 0,
      };
      return { ...prev, obligors: [...prev.obligors, newEntry] };
    });
  };

  const updateObligor = (id: string, patch: Partial<ObligorEntry>) => {
    setState(prev => ({ ...prev, obligors: prev.obligors.map(o => o.id === id ? { ...o, ...patch } : o) }));
  };

  const removeObligor = (id: string) => {
    setState(prev => {
      const filtered = prev.obligors.filter(o => o.id !== id);
      const hasNewPrimary = filtered.some(o => o.isPrimary);
      const next = hasNewPrimary || filtered.length === 0
        ? filtered
        : filtered.map((o, i) => i === 0 ? { ...o, isPrimary: true } : o);
      return { ...prev, obligors: next };
    });
  };

  const setPrimary = (id: string) => {
    setState(prev => ({
      ...prev,
      obligors: prev.obligors.map(o => ({ ...o, isPrimary: o.id === id })),
    }));
  };

  const handleAnalyze = async () => {
    if (!analysisFiles.length) return;
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResults(null);
    try {
      const formData = new FormData();
      for (const file of analysisFiles) {
        formData.append('files', file);
      }
      const res = await fetch(`/api/llcs/${llcId}/aoc/analyze-documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        setAnalysisError(data.error?.message || 'Analysis failed');
      } else {
        setAnalysisResults(data.data as AnalysisResult);
      }
    } catch {
      setAnalysisError('Unexpected error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const validateStep = (step: 1 | 2 | 3): boolean => {
    setFieldError('');
    if (step === 1) {
      const result = aocStep1Schema.safeParse({
        claimType: state.claimType,
        claimDescription: state.claimDescription,
        claimValueCents: state.claimValueDollars ? dollarsToCents(state.claimValueDollars) : undefined,
        obligors: state.obligors.map(o => ({
          name: o.name,
          address: o.address || undefined,
          phone: o.phone || undefined,
          email: o.email || undefined,
          isPrimary: o.isPrimary,
        })),
        propertyAddress: buildPropertyAddress(state),
        insuranceClaimNumber: state.insuranceClaimNumber || undefined,
        insurer: state.insurer || undefined,
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    if (step === 2) {
      const result = aocStep2Schema.safeParse({
        assignee: {
          name: state.assigneeName,
          entityType: state.assigneeEntityType,
          address: state.assigneeAddress,
          phone: state.assigneePhone || undefined,
          email: state.assigneeEmail || undefined,
        },
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    if (step === 3) {
      const result = aocStep3Schema.safeParse({
        considerationCents: dollarsToCents(state.considerationDollars),
        effectiveDate: state.effectiveDate,
        expirationDate: state.expirationDate || undefined,
        warrantsGoodTitle: state.warrantsGoodTitle,
        specialConditions: state.specialConditions || undefined,
        requiresNotarization: state.requiresNotarization,
        exhibits: state.exhibits,
      });
      if (!result.success) {
        setFieldError(result.error.issues[0]?.message ?? 'Invalid input');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep(state.step as 1 | 2 | 3)) return;
    const newStep = (state.step + 1) as WizardState['step'];
    if (newStep === 4) {
      const indices = state.obligors
        .map((o, i) => ({ o, i }))
        .filter(({ o }) => o.address.trim() !== '')
        .map(({ i }) => i);
      set({ step: newStep, noticeAddressIndices: indices });
    } else {
      set({ step: newStep });
    }
  };

  const back = () => {
    setFieldError('');
    set({ step: (state.step - 1) as WizardState['step'] });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFieldError('');
    try {
      const primaryObligor = state.obligors.find(o => o.isPrimary) ?? state.obligors[0];
      const body = {
        claimType: state.claimType,
        claimDescription: state.claimDescription,
        claimValueCents: state.claimValueDollars ? dollarsToCents(state.claimValueDollars) : undefined,
        obligors: state.obligors.length > 0 ? state.obligors.map(o => ({
          name: o.name,
          address: o.address || undefined,
          phone: o.phone || undefined,
          email: o.email || undefined,
          isPrimary: o.isPrimary,
        })) : undefined,
        tenantName: primaryObligor?.name || undefined,
        tenantAddress: primaryObligor?.address || undefined,
        tenantPhone: primaryObligor?.phone || undefined,
        tenantEmail: primaryObligor?.email || undefined,
        propertyAddress: buildPropertyAddress(state),
        insuranceClaimNumber: state.insuranceClaimNumber || undefined,
        insurer: state.insurer || undefined,
        assignee: {
          name: state.assigneeName,
          entityType: state.assigneeEntityType,
          address: state.assigneeAddress,
          phone: state.assigneePhone || undefined,
          email: state.assigneeEmail || undefined,
        },
        considerationCents: dollarsToCents(state.considerationDollars),
        effectiveDate: state.effectiveDate,
        expirationDate: state.expirationDate || undefined,
        warrantsGoodTitle: state.warrantsGoodTitle,
        specialConditions: state.specialConditions || undefined,
        requiresNotarization: state.requiresNotarization || undefined,
        exhibits: state.exhibits.length > 0 ? state.exhibits : undefined,
        assignorSignatoryName: state.assignorSignDigitally && state.assignorSignatoryName ? state.assignorSignatoryName : undefined,
        assignorTitle: state.assignorSignDigitally && state.assignorTitle ? state.assignorTitle : undefined,
        assigneeSignatoryName: state.assigneeSignDigitally && state.assigneeSignatoryName ? state.assigneeSignatoryName : undefined,
        assigneeTitle: state.assigneeSignDigitally && state.assigneeTitle ? state.assigneeTitle : undefined,
        noticeSignatoryName: state.noticeSignatoryName || undefined,
        noticeSignedDate: state.noticeSignedDate || undefined,
        caseId: state.caseId || undefined,
      };

      const res = await fetch(`/api/llcs/${llcId}/aoc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setFieldError(data.error?.message || 'Failed to create assignment');
        return;
      }

      const saved: AssignmentOfClaim = data.data;

      // Store generated document HTML and notice signatory info
      const docHtml = generateAocDocument(saved);
      await fetch(`/api/llcs/${llcId}/aoc/${saved.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentHtml: docHtml,
          ...(state.noticeSignatoryName && { noticeSignatoryName: state.noticeSignatoryName }),
          ...(state.noticeSignedDate && { noticeSignedDate: state.noticeSignedDate }),
        }),
      });

      router.push(`/llcs/${llcId}/assignments/${saved.id}`);
    } catch {
      setFieldError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Claim Details', 'Assignee', 'Terms', 'Review'];

  return (
    <div className="max-w-2xl">
      {/* Case pre-fill banner */}
      {state.caseId && !caseBannerDismissed && (
        <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <span>Pre-filling from case: <strong>{state.caseLabel}</strong></span>
          <button onClick={() => setCaseBannerDismissed(true)} className="ml-4 text-blue-600 hover:text-blue-800">✕</button>
        </div>
      )}

      {/* AI Document Analysis Panel */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setAnalysisOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 2.1 9.1"/>
            </svg>
            AI Document Analysis
          </span>
          <span className="text-muted-foreground">{analysisOpen ? '▲' : '▼'}</span>
        </button>

        {analysisOpen && (
          <div className="p-4 space-y-4">
            {/* Drop zone */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files);
                setAnalysisFiles(prev => {
                  const combined = [...prev, ...dropped];
                  return combined.slice(0, 5);
                });
              }}
            >
              <p className="text-sm font-medium">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF, images, and text files (up to 5 files, 10 MB each)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt"
                className="hidden"
                onChange={e => {
                  const picked = Array.from(e.target.files ?? []);
                  setAnalysisFiles(prev => {
                    const combined = [...prev, ...picked];
                    return combined.slice(0, 5);
                  });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </div>

            {/* File chips */}
            {analysisFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {analysisFiles.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full">
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setAnalysisFiles(prev => prev.filter((_, j) => j !== i))}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Analyze button */}
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={analyzing || !analysisFiles.length}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Documents'}
            </button>

            {/* Error */}
            {analysisError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{analysisError}</div>
            )}

            {/* Results */}
            {analysisResults && (
              <div className="space-y-4 pt-2 border-t">
                {/* Primary output — Claim Description */}
                <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-primary/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Suggested Claim Description</p>
                    <button
                      type="button"
                      onClick={() => {
                        set({ claimDescription: analysisResults.claimDescription });
                        setAnalysisOpen(false);
                      }}
                      className="shrink-0 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90"
                    >
                      Use this description
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {analysisResults.claimDescription}
                  </p>
                </div>

                {/* Per-document detail */}
                {analysisResults.documents.length > 0 && (
                  <details className="group">
                    <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none">
                      Document detail ({analysisResults.documents.length} file{analysisResults.documents.length !== 1 ? 's' : ''})
                    </summary>
                    <div className="mt-3 space-y-3">
                      {analysisResults.documents.map((doc, i) => (
                        <div key={i} className="border rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate max-w-[200px]">{doc.fileName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_TYPE_COLORS[doc.documentType] ?? 'bg-secondary text-muted-foreground'}`}>
                              {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                            </span>
                          </div>

                          <p className="text-muted-foreground text-xs leading-relaxed">{doc.summary}</p>

                          {doc.parties.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {doc.parties.map((p, j) => (
                                <span key={j} className="text-xs border rounded px-2 py-0.5">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-muted-foreground ml-1">({p.role})</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {doc.keyAmounts.length > 0 && (
                            <table className="w-full text-xs">
                              <tbody>
                                {doc.keyAmounts.map((a, j) => (
                                  <tr key={j} className="border-b last:border-b-0">
                                    <td className="py-1 text-muted-foreground pr-4">{a.description}</td>
                                    <td className="py-1 font-medium text-right">{a.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {doc.keyDates.length > 0 && (
                            <table className="w-full text-xs">
                              <tbody>
                                {doc.keyDates.map((d, j) => (
                                  <tr key={j} className="border-b last:border-b-0">
                                    <td className="py-1 text-muted-foreground pr-4">{d.description}</td>
                                    <td className="py-1 font-medium text-right">{d.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {Object.values(doc.suggestedFields).some(Boolean) && (
                            <div className="bg-blue-50 border border-blue-100 rounded-md p-2 text-xs text-blue-700 space-y-0.5">
                              {doc.suggestedFields.tenantName && <div>Tenant: <span className="font-medium">{doc.suggestedFields.tenantName}</span></div>}
                              {doc.suggestedFields.propertyAddress && <div>Property: <span className="font-medium">{doc.suggestedFields.propertyAddress}</span></div>}
                              {doc.suggestedFields.claimType && <div>Claim type: <span className="font-medium">{ASSIGNMENT_CLAIM_TYPE_LABELS[doc.suggestedFields.claimType]}</span></div>}
                              {doc.suggestedFields.claimValueDollars && <div>Claim value: <span className="font-medium">${doc.suggestedFields.claimValueDollars}</span></div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">New Assignment of Claim</h1>
        <div className="flex gap-2 flex-wrap">
          {stepTitles.map((title, i) => (
            <div key={title} className="flex items-center gap-1">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  state.step === i + 1
                    ? 'bg-primary text-primary-foreground'
                    : state.step > i + 1
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {state.step > i + 1 ? '✓' : i + 1}
              </span>
              <span className={`text-xs ${state.step === i + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                {title}
              </span>
              {i < stepTitles.length - 1 && <span className="text-muted-foreground text-xs mx-1">›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {state.step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Claim Type</label>
            <div className="space-y-2">
              {(Object.entries(ASSIGNMENT_CLAIM_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                <label key={value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary/30">
                  <input
                    type="radio"
                    name="claimType"
                    value={value}
                    checked={state.claimType === value}
                    onChange={() => set({ claimType: value })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground">
                      {value === 'rent_debt' && 'Assign unpaid rent or tenant debt for collection'}
                      {value === 'insurance_claim' && 'Assign proceeds or rights from an insurance claim'}
                      {value === 'general_monetary' && 'Assign any other monetary claim or right'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {state.claimType === 'rent_debt' && (
            <div className="space-y-4">
              {/* Obligors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Obligor(s)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Add all tenants and guarantors who owe this debt</p>
                  </div>
                  <button
                    type="button"
                    onClick={addObligor}
                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90"
                  >
                    + Add Obligor
                  </button>
                </div>

                {state.obligors.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                    No obligors added. Click &ldquo;+ Add Obligor&rdquo; to add a tenant or guarantor.
                  </p>
                )}

                {state.obligors.map((obligor, idx) => (
                  <div key={obligor.id} className="p-3 border rounded-lg space-y-2 bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Obligor {idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="obligorPrimary"
                            checked={obligor.isPrimary}
                            onChange={() => setPrimary(obligor.id)}
                          />
                          Primary
                        </label>
                        <button
                          type="button"
                          onClick={() => removeObligor(obligor.id)}
                          className="text-xs text-destructive hover:opacity-70"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={obligor.name}
                        onChange={e => updateObligor(obligor.id, { name: e.target.value })}
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Mailing Address (optional)</label>
                      <textarea
                        value={obligor.address}
                        onChange={e => updateObligor(obligor.id, { address: e.target.value })}
                        rows={2}
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                        placeholder="Street, City, State ZIP"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">Phone (optional)</label>
                        <input
                          type="tel"
                          value={obligor.phone}
                          onChange={e => updateObligor(obligor.id, { phone: e.target.value })}
                          className="w-full border rounded-md px-3 py-1.5 text-sm"
                          placeholder="(612) 555-0100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Email (optional)</label>
                        <input
                          type="email"
                          value={obligor.email}
                          onChange={e => updateObligor(obligor.id, { email: e.target.value })}
                          className="w-full border rounded-md px-3 py-1.5 text-sm"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Property Address */}
              <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Address</label>
                  <input
                    type="text"
                    value={state.propertyStreet}
                    onChange={e => set({ propertyStreet: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="Street address (e.g. 1815 E Lake St)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Suite / Unit (optional)</label>
                  <input
                    type="text"
                    value={state.propertyUnit}
                    onChange={e => set({ propertyUnit: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="Suite 200, Unit 4B, etc."
                  />
                </div>
                <div className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={state.propertyCity}
                      onChange={e => set({ propertyCity: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="Minneapolis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      value={state.propertyState}
                      onChange={e => set({ propertyState: e.target.value.toUpperCase().slice(0, 2) })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm uppercase"
                      placeholder="MN"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP</label>
                    <input
                      type="text"
                      value={state.propertyZip}
                      onChange={e => set({ propertyZip: e.target.value.slice(0, 10) })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="55401"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.claimType === 'insurance_claim' && (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Insurer</label>
                <input
                  type="text"
                  value={state.insurer}
                  onChange={e => set({ insurer: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Claim Number</label>
                <input
                  type="text"
                  value={state.insuranceClaimNumber}
                  onChange={e => set({ insuranceClaimNumber: e.target.value })}
                  className="w-full border rounded-md px-3 py-1.5 text-sm"
                  placeholder="Claim #"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block text-sm font-medium">
                Claim Description <span className="text-destructive">*</span>
              </label>
              <span className={`text-xs ${state.claimDescription.length > 9000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {state.claimDescription.length.toLocaleString()} / 10,000
              </span>
            </div>
            <textarea
              value={state.claimDescription}
              onChange={e => set({ claimDescription: e.target.value })}
              rows={12}
              className="w-full border rounded-md px-3 py-2 text-sm leading-relaxed font-[inherit] resize-y"
              placeholder="Describe the claim in detail (minimum 10 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Claim Value (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.claimValueDollars}
                onChange={e => set({ claimValueDollars: e.target.value })}
                className="w-full border rounded-md pl-7 pr-3 py-1.5 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {state.step === 2 && (
        <div className="space-y-4">
          {savedAssignees.length > 0 && (
            <div className="p-3 border rounded-lg bg-secondary/20">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Saved Assignees</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {savedAssignees.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => set({
                      assigneeName: a.displayName ?? '',
                      assigneeEntityType: a.assigneeEntityType ?? 'individual',
                      assigneeAddress: formatUserAddress(a),
                      assigneePhone: a.phoneNumber ?? '',
                      assigneeEmail: a.email ?? '',
                    })}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary/60 transition-colors"
                  >
                    <span className="font-medium">{a.displayName ?? a.email}</span>
                    {a.assigneeEntityType && (
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{a.assigneeEntityType}</span>
                    )}
                    {a.mailingAddress && (
                      <div className="text-xs text-muted-foreground truncate">{formatUserAddress(a)}</div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to pre-fill. You can edit any field below.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Entity Type</label>
            <div className="flex gap-3">
              {(['individual', 'company'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entityType"
                    value={t}
                    checked={state.assigneeEntityType === t}
                    onChange={() => set({ assigneeEntityType: t })}
                  />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {state.assigneeEntityType === 'company' ? 'Company Name' : 'Full Name'}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={state.assigneeName}
              onChange={e => set({ assigneeName: e.target.value })}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder={state.assigneeEntityType === 'company' ? 'Company, LLC' : 'First Last'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address <span className="text-destructive">*</span>
            </label>
            <textarea
              value={state.assigneeAddress}
              onChange={e => set({ assigneeAddress: e.target.value })}
              rows={2}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder="Street, City, State ZIP"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={state.assigneePhone}
                onChange={e => set({ assigneePhone: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
                placeholder="(612) 555-0100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (optional)</label>
              <input
                type="email"
                value={state.assigneeEmail}
                onChange={e => set({ assigneeEmail: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {state.step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Consideration <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={state.considerationDollars}
                onChange={e => set({ considerationDollars: e.target.value })}
                className="w-full border rounded-md pl-7 pr-3 py-1.5 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter $1.00 for nominal consideration (standard Minnesota practice)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Effective Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={state.effectiveDate}
                onChange={e => set({ effectiveDate: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date (optional)</label>
              <input
                type="date"
                value={state.expirationDate}
                onChange={e => set({ expirationDate: e.target.value })}
                className="w-full border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          {state.expirationDate && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
              <strong>Caution:</strong> Expiration dates are uncommon in assignments of claim and may undermine the irrevocable nature of the assignment. Courts may interpret this as a conditional transfer. Consult legal counsel before including this provision.
            </div>
          )}

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.warrantsGoodTitle}
                onChange={e => set({ warrantsGoodTitle: e.target.checked })}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">Warrant Good Title</div>
                <div className="text-xs text-muted-foreground">
                  Assignor warrants the claim is free and clear of prior assignments. Uncheck for an as-is assignment with no title warranty.
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Supporting Documents / Exhibits</label>
            <p className="text-xs text-muted-foreground mb-2">
              Check each document you are attaching. Only checked items will appear as exhibits in the generated document.
              Exhibit A (Notice to Obligor) is always included.
            </p>
            <div className="space-y-2 p-3 border rounded-md">
              {AOC_EXHIBIT_DEFINITIONS.filter(d =>
                (d.claimTypes as string[]).includes(state.claimType)
              ).map(def => (
                <label key={def.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={state.exhibits.includes(def.key)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...state.exhibits, def.key]
                        : state.exhibits.filter(k => k !== def.key);
                      set({ exhibits: next });
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium">{def.label}</div>
                    <div className="text-xs text-muted-foreground">{def.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Special Conditions (optional)</label>
            <textarea
              value={state.specialConditions}
              onChange={e => set({ specialConditions: e.target.value })}
              rows={3}
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              placeholder="Any additional terms or conditions..."
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.requiresNotarization}
              onChange={e => set({ requiresNotarization: e.target.checked })}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">Include Notarization Block</div>
              <div className="text-xs text-muted-foreground">
                Recommended when the claim involves real property. A notary acknowledgment block will be added to the document. You will need to have the signatures notarized before the document is fully executed.
              </div>
            </div>
          </label>

          <div className="space-y-3 border rounded-lg p-3">
            <p className="text-sm font-medium">Electronic Signatures</p>
            <p className="text-xs text-muted-foreground -mt-1">
              Applies <span className="font-mono">/s/ Name</span> to signature lines. Authorized under the Minnesota Uniform Electronic Transactions Act, Minn. Stat. § 325L.
            </p>

            {/* Assignor */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.assignorSignDigitally}
                  onChange={e => set({ assignorSignDigitally: e.target.checked })}
                />
                <span className="text-sm font-medium">Sign as Assignor</span>
              </label>
              {state.assignorSignDigitally && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.assignorSignatoryName}
                      onChange={e => set({ assignorSignatoryName: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="Full name of the person signing on behalf of the LLC"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Title / Role (optional)</label>
                    <input
                      type="text"
                      value={state.assignorTitle}
                      onChange={e => set({ assignorTitle: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="e.g. Member, Manager, President"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.assigneeSignDigitally}
                  onChange={e => set({ assigneeSignDigitally: e.target.checked })}
                />
                <span className="text-sm font-medium">Sign as Assignee</span>
              </label>
              {state.assigneeSignDigitally && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={state.assigneeSignatoryName}
                      onChange={e => set({ assigneeSignatoryName: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder={state.assigneeName || 'Full name of the person signing'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Title / Role (optional)</label>
                    <input
                      type="text"
                      value={state.assigneeTitle}
                      onChange={e => set({ assigneeTitle: e.target.value })}
                      className="w-full border rounded-md px-3 py-1.5 text-sm"
                      placeholder="e.g. Member, Manager, CEO"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Review */}
      {state.step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border rounded-lg p-4 bg-secondary/20">
            <div>
              <div className="text-xs text-muted-foreground">Claim Type</div>
              <div className="font-medium">
                {ASSIGNMENT_CLAIM_TYPE_LABELS[state.claimType as keyof typeof ASSIGNMENT_CLAIM_TYPE_LABELS] ?? state.claimType}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Effective Date</div>
              <div className="font-medium">{state.effectiveDate}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">Description</div>
              <div className="font-medium">{state.claimDescription}</div>
            </div>
            {state.claimValueDollars && (
              <div>
                <div className="text-xs text-muted-foreground">Claim Value</div>
                <div className="font-medium">${parseFloat(state.claimValueDollars).toFixed(2)}</div>
              </div>
            )}
            {state.claimType === 'rent_debt' && state.obligors.length > 0 && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">Obligor(s)</div>
                <div className="space-y-0.5 mt-0.5">
                  {state.obligors.map(o => (
                    <div key={o.id} className="text-sm font-medium">
                      {o.name}{o.isPrimary ? ' (Primary)' : ''}
                      {o.address && <span className="text-muted-foreground font-normal ml-2 text-xs">{o.address}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Assignee</div>
              <div className="font-medium">{state.assigneeName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Assignee Type</div>
              <div className="font-medium capitalize">{state.assigneeEntityType}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Consideration</div>
              <div className="font-medium">
                ${parseFloat(state.considerationDollars || '0').toFixed(2)}
                {parseFloat(state.considerationDollars || '0') <= 1 && ' (nominal)'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Title Warranty</div>
              <div className="font-medium">{state.warrantsGoodTitle ? 'Yes — Warrants Good Title' : 'No — As-Is'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Document Preview</div>
            <iframe
              srcDoc={generateAocDocument(buildPreview(state))}
              style={{ width: '100%', height: '600px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              title="Assignment of Claim Preview"
            />
          </div>

          {/* Notice to Obligor section */}
          {state.claimType === 'rent_debt' && state.obligors.length > 0 && state.obligors.some(o => o.address.trim()) && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <p className="text-sm font-medium mb-0.5">Notice to Obligor</p>
                <p className="text-xs text-muted-foreground">Select which obligors should receive printed notice letters.</p>
              </div>

              <div className="space-y-2">
                {state.obligors.map((obligor, idx) => (
                  <label
                    key={obligor.id}
                    className={`flex items-start gap-3 p-2 rounded-md border ${obligor.address.trim() ? 'cursor-pointer hover:bg-secondary/30' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      disabled={!obligor.address.trim()}
                      checked={state.noticeAddressIndices.includes(idx)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...state.noticeAddressIndices, idx]
                          : state.noticeAddressIndices.filter(i => i !== idx);
                        set({ noticeAddressIndices: next });
                      }}
                    />
                    <span className="text-sm leading-snug">
                      <span className="font-medium">{obligor.name || '(unnamed)'}</span>
                      {obligor.isPrimary && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Primary</span>
                      )}
                      {obligor.address ? (
                        <span className="block text-xs text-muted-foreground mt-0.5">{obligor.address}</span>
                      ) : (
                        <span className="block text-xs text-muted-foreground italic mt-0.5">No address — cannot send notice</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Notice Signatory Name</label>
                  <input
                    type="text"
                    value={state.noticeSignatoryName}
                    onChange={e => set({ noticeSignatoryName: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="Name of person signing the notice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Signed</label>
                  <input
                    type="date"
                    value={state.noticeSignedDate}
                    onChange={e => set({ noticeSignedDate: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              {state.noticeAddressIndices.length > 0 && (
                <div className="space-y-4">
                  {state.noticeAddressIndices.map(idx => {
                    const obligor = state.obligors[idx];
                    if (!obligor) return null;
                    const noticeData = {
                      ...buildPreview(state),
                      noticeSignatoryName: state.noticeSignatoryName || undefined,
                      noticeSignedDate: state.noticeSignedDate || undefined,
                    };
                    return (
                      <div key={idx}>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Notice — {obligor.name}
                        </p>
                        <iframe
                          srcDoc={generateNoticeToObligor(noticeData, { name: obligor.name, address: obligor.address })}
                          style={{ width: '100%', height: '500px', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                          title={`Notice to ${obligor.name}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {fieldError && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{fieldError}</div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={back}
          disabled={state.step === 1}
          className="px-4 py-2 text-sm border rounded-md hover:bg-secondary/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {state.step < 4 ? (
          <button
            onClick={next}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Save & Create'}
          </button>
        )}
      </div>
    </div>
  );
}
