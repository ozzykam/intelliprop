import type { ClauseDefinition } from '../../../types/leaseBuilder';

export const commercialCasualtyClauses: ClauseDefinition[] = [
  {
    id: 'comm-casualty-condemnation',
    leaseClass: 'commercial',
    category: 'casualty_condemnation',
    title: 'Casualty & Condemnation',
    description: 'Addresses what happens if the premises are damaged by fire/disaster or taken by eminent domain.',
    isRequired: true,
    placeholders: ['casualtyTerminationRight'],
    sortOrder: 950,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
    htmlContent: `
<h3>18. CASUALTY AND CONDEMNATION</h3>

<p><strong>(a) Casualty.</strong> If the Premises or a substantial portion thereof are damaged or destroyed by fire, storm, or other casualty, Landlord shall notify Tenant within thirty (30) days of such event whether Landlord elects to restore the Premises. If Landlord elects to restore, Landlord shall proceed with reasonable diligence to restore the Premises to substantially the same condition as before the casualty, and rent shall abate proportionately during the period of restoration based on the portion of the Premises rendered unusable.</p>

<p>If Landlord does not elect to restore, or if restoration cannot reasonably be completed within one hundred eighty (180) days, {{casualtyTerminationRight}} may terminate this Lease upon thirty (30) days written notice.</p>

<p><strong>(b) Condemnation.</strong> If all or a substantial portion of the Premises is taken by eminent domain or condemnation, this Lease shall terminate as of the date of taking. If a partial taking does not render the Premises unsuitable for Tenant's permitted use, the Lease shall continue and rent shall be equitably reduced.</p>

<p>All condemnation awards shall belong to Landlord, except that Tenant may separately claim compensation for Tenant's trade fixtures, moving expenses, and loss of business, provided such claim does not diminish Landlord's award.</p>

<p><strong>(c) Tenant's Insurance Obligation.</strong> Nothing in this section relieves Tenant of the obligation to maintain insurance as required under this Lease. Tenant's business interruption insurance shall be Tenant's sole remedy for lost business income during casualty restoration.</p>
`,
  },
];
