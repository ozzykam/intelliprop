import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuthUser } from '@/lib/auth/requireUser';
import { listTimesheetEntries } from '@/lib/services/timesheetEntry.service';
import { getUser } from '@/lib/services/user.service';
import { TIMESHEET_TIMEZONE, TIMESHEET_CATEGORY_LABELS, TimesheetCategory } from '@shared/types';

const anthropic = new Anthropic();

function getTodayCDT(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMESHEET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: { period?: string; dateFrom?: string; dateTo?: string };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { period, dateFrom: rawFrom, dateTo: rawTo } = body;
  const today = getTodayCDT();

  let dateFrom: string;
  let dateTo: string;
  let periodLabel: string;

  if (period === 'today') {
    dateFrom = today;
    dateTo = today;
    periodLabel = `for today (${today})`;
  } else if (period === 'week') {
    // Monday of the current CDT week
    const now = new Date();
    const cdtDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMESHEET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMESHEET_TIMEZONE,
      weekday: 'short',
    }).format(now);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIndex = dayNames.indexOf(dayOfWeek);
    const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
    dateFrom = addDays(cdtDateStr, -daysFromMonday);
    dateTo = today;
    periodLabel = `for this week (${dateFrom} to ${dateTo})`;
  } else if (period === 'month') {
    dateFrom = `${today.slice(0, 7)}-01`;
    dateTo = today;
    periodLabel = `for this month (${dateFrom} to ${dateTo})`;
  } else if (period === 'custom') {
    if (!rawFrom || !rawTo) {
      return new Response(
        JSON.stringify({ ok: false, error: { code: 'INVALID_INPUT', message: 'dateFrom and dateTo are required for custom period' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    dateFrom = rawFrom;
    dateTo = rawTo;
    periodLabel = `for the period ${dateFrom} to ${dateTo}`;
  } else {
    return new Response(
      JSON.stringify({ ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid period' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [entries, userRecord] = await Promise.all([
    listTimesheetEntries(user.uid, { dateFrom, dateTo, limit: 200 }),
    getUser(user.uid),
  ]);

  const displayName = userRecord?.displayName ?? userRecord?.email ?? 'the user';

  if (entries.length === 0) {
    return new Response('No activity was logged in the selected period.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Sort oldest → newest
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const totalMinutes = sorted.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
  const completed = sorted.filter(e => e.status === 'completed').length;
  const incomplete = sorted.length - completed;

  const entryLines = sorted.map(e => {
    const catLabel = TIMESHEET_CATEGORY_LABELS[e.category as TimesheetCategory] ?? e.category;
    const dur = e.durationMinutes != null ? formatMinutes(e.durationMinutes) : '?';
    const inProgress = e.status !== 'completed' ? ' [in progress]' : '';
    let line = `[${e.date}] ${catLabel} — "${e.title}" (${dur})${inProgress}`;
    if (e.notes) {
      line += `\n  Notes: ${e.notes}`;
    }
    return line;
  }).join('\n');

  const prompt = `You are reviewing the timesheet activity log for ${displayName} ${periodLabel}.

Stats: ${sorted.length} entries, ${formatMinutes(totalMinutes)} logged (${completed} completed, ${incomplete} still in progress).

Entries (oldest first):
${entryLines}

Write a concise activity summary in 2–4 short paragraphs. Cover:
- High-level overview (total time, main focus areas by category)
- Specific tasks worth calling out by name
- Any in-progress or incomplete items that may still need attention

Be specific and reference actual task titles. Do not invent anything not in the data. Keep the tone professional and direct.`;

  const messageStream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      messageStream.on('text', (text: string) => {
        controller.enqueue(encoder.encode(text));
      });
      messageStream.on('error', (err: unknown) => {
        controller.error(err);
      });
      messageStream.finalMessage().then(() => {
        controller.close();
      }).catch((err: unknown) => {
        controller.error(err);
      });
    },
    cancel() {
      messageStream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
