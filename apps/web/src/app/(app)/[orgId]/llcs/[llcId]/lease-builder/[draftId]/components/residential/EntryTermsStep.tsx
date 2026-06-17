'use client';

import type { LeaseBuilderDraft } from '@shared/types/leaseBuilder';

interface StepProps {
  draft: LeaseBuilderDraft & { id: string };
  llcId: string;
  updateDraft: (updates: Partial<LeaseBuilderDraft>) => void;
  saveDraft: (updates: Partial<LeaseBuilderDraft>) => Promise<boolean>;
}

const inputClass = 'w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring';

export default function EntryTermsStep({ draft, updateDraft }: StepProps) {
  const entry = draft.residential?.entry ?? {
    noticeHours: 24,
    maintenanceRequestMethod: 'online_portal',
    emergencyContactMethod: 'phone',
    emergencyContactInfo: '',
  };

  function update(field: string, value: unknown) {
    updateDraft({
      residential: {
        ...draft.residential!,
        entry: { ...entry, [field]: value },
      },
    } as Partial<LeaseBuilderDraft>);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Entry & Repairs</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Notice Before Entry (hours) *
          </label>
          <select
            value={entry.noticeHours}
            onChange={(e) => update('noticeHours', Number(e.target.value))}
            className={inputClass}
          >
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
            <option value={72}>72 hours</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Minnesota law requires &quot;reasonable notice&quot; — 24 hours is the standard minimum.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Maintenance Request Method *
          </label>
          <select
            value={entry.maintenanceRequestMethod}
            onChange={(e) => update('maintenanceRequestMethod', e.target.value)}
            className={inputClass}
          >
            <option value="online_portal">Online Portal</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="written">Written Notice</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Emergency Contact Method *
          </label>
          <select
            value={entry.emergencyContactMethod}
            onChange={(e) => update('emergencyContactMethod', e.target.value)}
            className={inputClass}
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="both">Phone & Email</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Emergency Contact Information *
          </label>
          <input
            type="text"
            value={entry.emergencyContactInfo}
            onChange={(e) => update('emergencyContactInfo', e.target.value)}
            className={inputClass}
            placeholder="Phone number, email, or both"
          />
        </div>
      </div>
    </div>
  );
}
