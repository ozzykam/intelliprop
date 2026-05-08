# Feature: Financials

Cross-LLC financial overview page at `/financials`. Long-term covers full AR and AP breakdowns.

---

## Accounts Receivable (AR)

| Category | Data Source | Status |
|---|---|---|
| Rental income (expected monthly) | `leases.rentAmount` | **Phase 1 — done** |
| Overdue rent | `charges` where `dueDate < today` and `status in ['open','partial']` | **Phase 1 — done** |
| Security deposits held | `leases.depositAmount` | Future |
| Late fees outstanding | `charges` where `type === 'late_fee'` | Future |

---

## Accounts Payable (AP)

| Category | Data Source | Status |
|---|---|---|
| Mortgages/Loans | `properties.mortgageInfo.monthlyPayment` | Phase 2 — data already exists |
| Property taxes | No model yet — need manual entry | Phase 3 |
| Insurance premiums | Insurance section in LLC sidebar — needs investigation | Phase 3 |
| Staffing/Management | No model yet — new collection needed | Phase 4 |
| Vendors/Maintenance | Work orders may have cost field | Phase 4 |

---

## Future Summaries

- Net Operating Income (NOI) = Total AR − Operating AP
- P&L by period
- Cash flow statement

---

## Implementation Notes

### Phase 1 (complete)
- Service: `apps/web/src/lib/services/financials.service.ts`
- API: `apps/web/src/app/api/financials/route.ts`
- Page: `apps/web/src/app/(app)/financials/page.tsx`
- Nav: Added "Financials" to `DashboardSidebar.tsx` between Dashboard and Tenants

### Phase 2 — Mortgages AP
- Pull `mortgageInfo.monthlyPayment` from each property doc
- Add AP section to the financials page below AR
- Compute simple NOI card: total monthly rent − total monthly mortgage

### Phase 3 — Taxes & Insurance AP
- Need to design data model for manual tax/insurance entries
- Likely a new `llcs/{llcId}/expenses` collection with `type`, `amount`, `frequency`

### Phase 4 — Staffing & Vendors AP
- Staffing: new collection `llcs/{llcId}/staff` with salary/wages
- Vendors: extend work orders to include `cost` field or separate `llcs/{llcId}/vendorContracts`
