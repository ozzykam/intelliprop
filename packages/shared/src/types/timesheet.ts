/**
 * Timesheet & Staff Activity Log Types
 *
 * Two main concepts:
 *  1. TimesheetClockSession — daily clock-in / clock-out (workday boundary)
 *  2. TimesheetEntry       — individual activity entry (manual or timer-tracked)
 *
 * Timezone: All `date` fields (YYYY-MM-DD) are in America/Chicago (CDT).
 * All timestamps are stored as UTC ISO strings (converted from Firestore Timestamps).
 */

// ─────────────────────────────────────────────
// Timezone constant
// ─────────────────────────────────────────────

export const TIMESHEET_TIMEZONE = 'America/Chicago';

// ─────────────────────────────────────────────
// Work Categories
// ─────────────────────────────────────────────

export const TIMESHEET_CATEGORIES = {
  general_admin: 'general_admin',
  tenant_communication: 'tenant_communication',
  leasing_support: 'leasing_support',
  maintenance_coordination: 'maintenance_coordination',
  accounting_rent_support: 'accounting_rent_support',
  compliance_legal_support: 'compliance_legal_support',
  property_unit_records: 'property_unit_records',
  owner_manager_support: 'owner_manager_support',
  marketing_listing_admin: 'marketing_listing_admin',
  training_internal_meetings: 'training_internal_meetings',
} as const;

export type TimesheetCategory = (typeof TIMESHEET_CATEGORIES)[keyof typeof TIMESHEET_CATEGORIES];

export const TIMESHEET_CATEGORY_LABELS: Record<TimesheetCategory, string> = {
  general_admin: 'General Admin',
  tenant_communication: 'Tenant Communication',
  leasing_support: 'Leasing Support',
  maintenance_coordination: 'Maintenance Coordination',
  accounting_rent_support: 'Accounting / Rent Support',
  compliance_legal_support: 'Compliance / Legal Support',
  property_unit_records: 'Property / Unit Records',
  owner_manager_support: 'Owner / Manager Support',
  marketing_listing_admin: 'Marketing / Listing Admin',
  training_internal_meetings: 'Training / Internal Meetings',
};

export const TIMESHEET_CATEGORY_EXAMPLES: Record<TimesheetCategory, string[]> = {
  general_admin: [
    'Filing documents',
    'Scanning/uploading records',
    'Email organization',
    'Calendar management',
    'Office supply ordering',
    'Internal admin tasks',
  ],
  tenant_communication: [
    'Answering tenant calls/emails',
    'Sending notices',
    'Following up on complaints',
    'Coordinating move-ins/move-outs',
    'Responding to portal messages',
  ],
  leasing_support: [
    'Scheduling showings',
    'Preparing lease packets',
    'Screening application paperwork',
    'Listing updates',
    'Applicant follow-up',
    'Move-in coordination',
  ],
  maintenance_coordination: [
    'Creating work orders',
    'Calling vendors',
    'Scheduling repairs',
    'Following up with maintenance staff',
    'Updating tenants on repair status',
    'Closing completed work orders',
  ],
  accounting_rent_support: [
    'Posting payments',
    'Sending balance reminders',
    'Preparing rent ledgers',
    'Reviewing delinquency lists',
    'Organizing invoices',
    'Assisting with deposits',
  ],
  compliance_legal_support: [
    'Drafting or preparing notices',
    'Organizing eviction documents',
    'Tracking lease violations',
    'Updating insurance/license records',
    'Preparing court or conciliation-related packets',
    'Documenting tenant communications',
  ],
  property_unit_records: [
    'Updating unit files',
    'Uploading inspection photos',
    'Tracking keys',
    'Updating tenant files',
    'Organizing lease documents',
    'Managing property-specific records',
  ],
  owner_manager_support: [
    'Preparing reports',
    'Pulling data for management',
    'Meeting notes',
    'Task follow-ups',
    'Vendor comparison research',
    'Special projects',
  ],
  marketing_listing_admin: [
    'Updating rental listings',
    'Uploading photos',
    'Responding to listing inquiries',
    'Preparing flyers',
    'Social media posting for vacancies',
  ],
  training_internal_meetings: [
    'Staff meetings',
    'Training sessions',
    'Process review',
    'Software onboarding',
    'SOP updates',
  ],
};

// ─────────────────────────────────────────────
// Clock Session Statuses
// ─────────────────────────────────────────────

export const TIMESHEET_CLOCK_STATUSES = {
  clocked_in: 'clocked_in',
  on_break: 'on_break',
  clocked_out: 'clocked_out',
} as const;

export type TimesheetClockStatus =
  (typeof TIMESHEET_CLOCK_STATUSES)[keyof typeof TIMESHEET_CLOCK_STATUSES];

// ─────────────────────────────────────────────
// Entry / Timer Statuses
// ─────────────────────────────────────────────

export const TIMESHEET_TIMER_STATUSES = {
  not_started: 'not_started',
  running: 'running',
  paused: 'paused',
  stopped: 'stopped',
} as const;

export type TimesheetTimerStatus =
  (typeof TIMESHEET_TIMER_STATUSES)[keyof typeof TIMESHEET_TIMER_STATUSES];

export const TIMESHEET_ENTRY_STATUSES = {
  in_progress: 'in_progress',
  paused: 'paused',
  completed: 'completed',
} as const;

export type TimesheetEntryStatus =
  (typeof TIMESHEET_ENTRY_STATUSES)[keyof typeof TIMESHEET_ENTRY_STATUSES];

// ─────────────────────────────────────────────
// Segment Types
// ─────────────────────────────────────────────

/** A break period within a clock session */
export interface TimesheetBreakSegment {
  /** UTC ISO timestamp from Firestore Timestamp.toDate().toISOString() */
  startedAt: string;
  /** UTC ISO timestamp — undefined while break is still active */
  endedAt?: string;
}

/**
 * A continuous work interval within an activity timer.
 * Multiple segments support pause → resume cycles.
 */
export interface TimesheetWorkSegment {
  /** UTC ISO timestamp from Firestore Timestamp.toDate().toISOString() */
  startedAt: string;
  /** UTC ISO timestamp — undefined while timer is currently running */
  endedAt?: string;
}

// ─────────────────────────────────────────────
// Clock Session
// Firestore path: /timesheetClockSessions/{sessionId}
// ─────────────────────────────────────────────

export interface TimesheetClockSession {
  id: string;
  userId: string;
  userDisplayName: string;
  /**
   * YYYY-MM-DD in America/Chicago (CDT).
   * Computed server-side using Intl.DateTimeFormat with timeZone: 'America/Chicago'.
   */
  date: string;
  /** UTC ISO — when the user clocked in */
  clockedInAt: string;
  /** UTC ISO — when the user clocked out (undefined while active) */
  clockedOutAt?: string;
  breaks: TimesheetBreakSegment[];
  /** Net worked minutes (totalTime - breakTime), computed on clock-out */
  totalWorkedMinutes?: number;
  /** Total break minutes, computed on clock-out */
  totalBreakMinutes?: number;
  status: TimesheetClockStatus;
  notes?: string;
  /** UTC ISO from Firestore serverTimestamp */
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// Timesheet Entry (Activity Log)
// Firestore path: /timesheetEntries/{entryId}
// ─────────────────────────────────────────────

export interface TimesheetEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  /**
   * YYYY-MM-DD in America/Chicago (CDT).
   * Represents the calendar day the work occurred.
   */
  date: string;

  category: TimesheetCategory;
  /** Short description of the work performed */
  title: string;
  notes?: string;

  // ── Timer tracking ────────────────────────────
  timerStatus: TimesheetTimerStatus;
  /**
   * All start/stop work intervals.
   * Each segment's timestamps are UTC ISO strings converted from Firestore Timestamps.
   */
  segments: TimesheetWorkSegment[];

  // ── Manual entry fields ───────────────────────
  isManualEntry: boolean;
  /** HH:MM in local (CDT) time */
  manualStartTime?: string;
  /** HH:MM in local (CDT) time */
  manualEndTime?: string;
  /** Break minutes to subtract from manual duration */
  manualBreakMinutes?: number;

  // ── Duration ──────────────────────────────────
  /**
   * Final duration in minutes.
   * Set when timer is stopped or manual times are saved.
   * Can be manually overridden on edit.
   */
  durationMinutes?: number;

  status: TimesheetEntryStatus;
  /** UTC ISO from Firestore serverTimestamp */
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// Input Types
// ─────────────────────────────────────────────

export interface CreateTimesheetEntryInput {
  /** YYYY-MM-DD in CDT */
  date: string;
  category: TimesheetCategory;
  title: string;
  notes?: string;
  isManualEntry?: boolean;
  /** HH:MM CDT */
  manualStartTime?: string;
  /** HH:MM CDT */
  manualEndTime?: string;
  manualBreakMinutes?: number;
  /** When true, the timer starts immediately on creation */
  startTimerImmediately?: boolean;
}

export interface UpdateTimesheetEntryInput {
  /** YYYY-MM-DD in CDT */
  date?: string;
  category?: TimesheetCategory;
  title?: string;
  notes?: string;
  isManualEntry?: boolean;
  manualStartTime?: string;
  manualEndTime?: string;
  manualBreakMinutes?: number;
  /** Direct duration override in minutes */
  durationMinutes?: number;
}

export type TimesheetTimerAction = 'start' | 'pause' | 'resume' | 'stop';
export type TimesheetClockAction = 'clock_out' | 'start_break' | 'end_break';

// ─────────────────────────────────────────────
// Access Tiers (enforced server-side)
// ─────────────────────────────────────────────

/**
 * superAdmin — sees only own entries (private by default)
 * admin      — sees manager + employee entries
 * manager    — sees employee entries
 * employee   — sees only own entries
 */
export type TimesheetAccessTier = 'superAdmin' | 'admin' | 'manager' | 'employee';

// ─────────────────────────────────────────────
// Staff Summary (returned by /api/timesheets/staff)
// ─────────────────────────────────────────────

export interface TimesheetStaffSummary {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  /** Entries logged today (CDT calendar day) */
  todayEntryCount: number;
  /** Sum of durationMinutes for today's completed entries */
  todayDurationMinutes: number;
  /** UTC ISO of the most recent entry's createdAt */
  lastActivityAt?: string;
}
