import type { ClauseDefinition } from '../../../types/leaseBuilder';

/**
 * Pet Clauses — Pet policies including no-pets and allowed-with-restrictions.
 * sortOrder: 600–649
 */
export const residentialPetClauses: ClauseDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // NO PETS ALLOWED
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-pets-no-pets',
    leaseClass: 'residential',
    category: 'pets',
    title: 'No Pets Allowed',
    description:
      'Prohibits pets on the premises. Includes required acknowledgment that service animals and assistance animals are not considered pets under federal and Minnesota law.',
    htmlContent: `<h3>Pet Policy &mdash; No Pets</h3>
<p><strong>No pets of any kind</strong> are permitted on or about the Premises at any time. This prohibition includes but is not limited to dogs, cats, birds, fish, reptiles, rodents, and any other domestic or exotic animals.</p>
<p>Tenant shall not feed, harbor, or invite stray or wild animals onto the Premises or common areas. If an unauthorized pet is found on the Premises, Tenant shall be in material breach of this Lease. Landlord may, in addition to any other remedies available under this Lease or Minnesota law:</p>
<ol>
  <li>Require Tenant to immediately remove the animal from the Premises;</li>
  <li>Charge Tenant for any damage to the Premises caused by the animal, including cleaning, repair, and pest treatment costs; and</li>
  <li>Initiate lease termination proceedings if the violation is not cured within a reasonable time after written notice.</li>
</ol>
<p><strong>Service and Assistance Animals.</strong> Notwithstanding the foregoing, this pet restriction does <strong>not</strong> apply to service animals as defined by the Americans with Disabilities Act (ADA) or assistance animals (including emotional support animals) for which a reasonable accommodation has been requested and approved in accordance with the Fair Housing Act (42 U.S.C. &sect; 3601 et seq.) and the Minnesota Human Rights Act (Minnesota Statutes Chapter 363A). Landlord shall not charge a pet deposit, pet rent, or pet fee for an approved service or assistance animal. Tenant requesting an accommodation shall provide Landlord with appropriate documentation as permitted by law.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.petPolicy',
        operator: 'equals',
        value: 'no_pets',
      },
    ],
    placeholders: [],
    sortOrder: 600,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PETS ALLOWED WITH RESTRICTIONS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'res-pets-allowed',
    leaseClass: 'residential',
    category: 'pets',
    title: 'Pets Allowed with Restrictions',
    description:
      'Permits pets subject to specified restrictions on type, number, weight, and breed. Includes pet rent, documentation requirements, and service/assistance animal compliance.',
    htmlContent: `<h3>Pet Policy &mdash; Pets Allowed</h3>
<p>Tenant may keep pet(s) on the Premises subject to the following terms and restrictions:</p>
<ol>
  <li><strong>Maximum Number of Pets:</strong> {{lease.petMaxCount}}</li>
  <li><strong>Allowed Pet Types:</strong> {{lease.petAllowedTypes}}</li>
  <li><strong>Weight Limit:</strong> {{lease.petWeightLimit}} pounds per animal</li>
  <li><strong>Restricted Breeds:</strong> {{lease.petRestrictedBreeds}}</li>
</ol>
<p><strong>Pet Rent.</strong> In addition to Monthly Rent, Tenant shall pay a monthly pet rent of <strong>{{lease.petRentPerMonth}}</strong> for each approved pet. Pet rent shall be due on the same date as Monthly Rent and shall be considered additional rent under this Lease.</p>
<p><strong>Pet Documentation.</strong> Tenant shall provide Landlord with the following documentation for each pet prior to bringing the pet onto the Premises:</p>
<ol>
  <li>Current vaccination records, including rabies vaccination (for dogs and cats);</li>
  <li>Proof of spay or neuter (if required by Landlord);</li>
  <li>Proof of renter&rsquo;s insurance or pet liability insurance covering the pet; and</li>
  <li>A recent photograph of the pet for identification purposes.</li>
</ol>
<p><strong>Tenant Responsibilities.</strong> Tenant agrees to:</p>
<ol>
  <li>Keep pets under control at all times, including on a leash in common areas;</li>
  <li>Immediately clean up after pets in all areas of the Premises, common areas, and grounds;</li>
  <li>Prevent pets from causing damage to the Premises, common areas, or the property of others;</li>
  <li>Prevent pets from creating noise, odor, or other nuisance that disturbs other residents; and</li>
  <li>Comply with all applicable local ordinances regarding pet ownership, licensing, and control.</li>
</ol>
<p>Landlord reserves the right to require removal of any pet that poses a danger to the health or safety of other residents, causes damage to the Premises, or constitutes a nuisance. Failure to comply with this pet policy constitutes a material breach of this Lease.</p>
<p><strong>Service and Assistance Animals.</strong> This pet policy does <strong>not</strong> apply to service animals as defined by the Americans with Disabilities Act (ADA) or assistance animals (including emotional support animals) for which a reasonable accommodation has been requested and approved in accordance with the Fair Housing Act (42 U.S.C. &sect; 3601 et seq.) and the Minnesota Human Rights Act (Minnesota Statutes Chapter 363A). Landlord shall not charge pet rent, a pet deposit, or a pet fee for an approved service or assistance animal. Breed, weight, and species restrictions do not apply to approved service or assistance animals. Tenant requesting an accommodation shall provide Landlord with appropriate documentation as permitted by law.</p>`,
    isRequired: false,
    conditions: [
      {
        field: 'residential.policies.petPolicy',
        operator: 'not_equals',
        value: 'no_pets',
      },
    ],
    placeholders: [
      'lease.petMaxCount',
      'lease.petAllowedTypes',
      'lease.petWeightLimit',
      'lease.petRestrictedBreeds',
      'lease.petRentPerMonth',
    ],
    sortOrder: 600,
    version: '1.0.0',
    lastReviewedDate: '2026-02-11',
  },
];
