# Platform Improvement Suggestions

## 1. Email / SMS Notification System

No email or SMS sending exists anywhere in the codebase. Critical events go completely unannounced:

- Rent due reminders
- Late fee applied
- Lease expiring in 60 days
- Work order status changes
- Upcoming court dates

**Recommendation:** Integrate a transactional email provider (e.g. Resend or SendGrid) triggered by Firebase Function events or Firestore document writes. SMS alerts via Twilio for time-sensitive items (late fees, court dates) would add further value.

---

## 2. Vacancy Pipeline & Applicant Tracking

The platform takes over once a lease exists, but there is no tooling for the step before it. Currently missing:

- Vacancy listing view (which units are available and since when)
- Online rental application form
- Applicant screening / approval workflow
- Pipeline from vacancy → applicant → lease creation

**Recommendation:** Add a lightweight leasing pipeline — a vacancy board per LLC showing open units, an application intake form (shareable link), and a simple approval/denial workflow that feeds directly into lease creation.

---

## 3. Financial Reporting & P&L by Property / LLC

The accounts receivable service surfaces overdue amounts, but there is no:

- Income statement or P&L per property or LLC
- Expense tracking (maintenance costs, insurance premiums, mortgage payments, etc.)
- Rent roll export (CSV / PDF)
- Yield or cap rate analysis over time

**Recommendation:** Build a Financials reporting section that aggregates charge/payment data against tracked expenses by property, producing a monthly P&L summary. A rent roll export (all active leases with rent amounts, due dates, tenant names) would be immediately useful for ownership-level review.

---

## 4. E-Signature Integration in the Lease Builder

The Lease Builder generates fully-formatted, legally-complete residential and commercial lease packages (MN-specific, with city overlays, disclosures, and addenda). However, after clicking "Generate," the signing workflow falls entirely outside the platform — leases must be printed, signed manually, or uploaded to an external tool.

**Recommendation:** Integrate an e-signature provider (DocuSign, HelloSign, or the open-source Documenso) directly into the Generate step. The generated PDF would be sent for signature from within the platform, and the countersigned document automatically stored against the published lease record.
