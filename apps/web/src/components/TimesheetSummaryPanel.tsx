'use client';

import { useState } from 'react';
import { TIMESHEET_TIMEZONE } from '@shared/types';

type Period = 'today' | 'week' | 'month' | 'custom';

function getTodayCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function TimesheetSummaryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = getTodayCDT();

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setSummary('');
    setError('');
  }

  async function handleGenerate() {
    setError('');

    if (period === 'custom') {
      if (!customFrom || !customTo) {
        setError('Please select both a start and end date.');
        return;
      }
      if (customFrom > customTo) {
        setError('Start date must be on or before the end date.');
        return;
      }
    }

    setSummary('');
    setLoading(true);

    try {
      const body: Record<string, string> = { period };
      if (period === 'custom') {
        body.dateFrom = customFrom;
        body.dateTo = customTo;
      }

      const res = await fetch('/api/timesheets/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Failed to generate summary.');
        return;
      }

      if (!res.body) {
        setError('No response body received.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummary(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setError('An error occurred while generating the summary.');
    } finally {
      setLoading(false);
    }
  }

  const periodButtons: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          <span className="font-medium text-sm">Activity Summary</span>
          <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">AI</span>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t">
          {/* Period selector */}
          <div className="flex flex-wrap gap-2 pt-4">
            {periodButtons.map(btn => (
              <button
                key={btn.value}
                type="button"
                onClick={() => handlePeriodChange(btn.value)}
                className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                  period === btn.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-muted'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={customFrom}
                  max={today}
                  onChange={e => { setCustomFrom(e.target.value); setSummary(''); setError(''); }}
                  className="text-sm border rounded-md px-2 py-1.5 bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={customTo}
                  max={today}
                  onChange={e => { setCustomTo(e.target.value); setSummary(''); setError(''); }}
                  className="text-sm border rounded-md px-2 py-1.5 bg-background"
                />
              </div>
            </div>
          )}

          {/* Generate button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {summary && !loading ? 'Regenerate' : 'Generate Summary'}
          </button>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Summary output */}
          {summary && (
            <div className="bg-secondary/30 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
