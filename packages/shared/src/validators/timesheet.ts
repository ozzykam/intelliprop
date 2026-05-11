import { z } from 'zod';
import { TIMESHEET_CATEGORIES } from '../types/timesheet';

const timesheetCategorySchema = z.enum([
  TIMESHEET_CATEGORIES.general_admin,
  TIMESHEET_CATEGORIES.tenant_communication,
  TIMESHEET_CATEGORIES.leasing_support,
  TIMESHEET_CATEGORIES.maintenance_coordination,
  TIMESHEET_CATEGORIES.accounting_rent_support,
  TIMESHEET_CATEGORIES.compliance_legal_support,
  TIMESHEET_CATEGORIES.property_unit_records,
  TIMESHEET_CATEGORIES.owner_manager_support,
  TIMESHEET_CATEGORIES.marketing_listing_admin,
  TIMESHEET_CATEGORIES.training_internal_meetings,
]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema for creating a new timesheet entry.
 * date must be YYYY-MM-DD (CDT calendar day).
 * manualStartTime / manualEndTime must be HH:MM (24-hour, CDT).
 */
export const createTimesheetEntrySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  category: timesheetCategorySchema,
  title: z.string().min(1, 'Title is required').max(200),
  notes: z.string().max(2000).optional(),
  isManualEntry: z.boolean().optional().default(false),
  manualStartTime: z.string().regex(timeRegex, 'Start time must be HH:MM').optional(),
  manualEndTime: z.string().regex(timeRegex, 'End time must be HH:MM').optional(),
  manualBreakMinutes: z.number().int().min(0).max(480).optional(),
  startTimerImmediately: z.boolean().optional().default(false),
});

/**
 * Schema for updating an existing timesheet entry.
 * All fields optional. durationMinutes allows manual override.
 */
export const updateTimesheetEntrySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  category: timesheetCategorySchema.optional(),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional(),
  privateNote: z.string().max(5000).nullable().optional(),
  isManualEntry: z.boolean().optional(),
  manualStartTime: z.string().regex(timeRegex).optional(),
  manualEndTime: z.string().regex(timeRegex).optional(),
  manualBreakMinutes: z.number().int().min(0).max(480).optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
});

/**
 * Schema for timer actions on an entry.
 */
export const timerActionSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'stop']),
});

/**
 * Schema for clock-in (start of workday).
 */
export const clockInSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * Schema for clock session actions (clock-out, break start/end).
 */
export const clockActionSchema = z.object({
  action: z.enum(['clock_out', 'start_break', 'end_break']),
  notes: z.string().max(500).optional(),
});
