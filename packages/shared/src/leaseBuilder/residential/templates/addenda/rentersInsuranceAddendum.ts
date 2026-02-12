/**
 * Renters Insurance Addendum Template
 *
 * Addendum to the Minnesota Residential Lease Agreement requiring Tenant to
 * maintain renters insurance (personal liability and property coverage) for the
 * duration of the Lease. Covers minimum coverage requirements, proof of insurance
 * deadlines, lapse consequences, and Landlord's interest.
 *
 * Placeholders:
 *   {{landlord.name}}         — Full legal name of the landlord
 *   {{tenant.names}}          — Full legal name(s) of the tenant(s)
 *   {{property.address}}      — Street address of the rental property
 *   {{unit.number}}           — Unit or apartment number
 *   {{insurance.minCoverage}} — Minimum personal liability coverage amount in dollars (e.g., "100,000")
 *   {{lease.startDate}}       — Lease commencement date
 *   {{templateVersion}}       — Template version string
 *   {{generatedDate}}         — Date the document was generated
 */

export const RENTERS_INSURANCE_ADDENDUM_TEMPLATE: string = `
<div class="page-break"></div>

<div class="addendum-header">RENTERS INSURANCE ADDENDUM</div>
<div class="addendum-subtitle">Addendum to Minnesota Residential Lease Agreement</div>

<p>This Renters Insurance Addendum (&ldquo;Addendum&rdquo;) is made and entered into as part of the Residential
Lease Agreement (&ldquo;Lease&rdquo;) dated <strong>{{lease.startDate}}</strong> by and between:</p>

<p><strong>Landlord:</strong> {{landlord.name}}</p>
<p><strong>Tenant(s):</strong> {{tenant.names}}</p>
<p><strong>Property:</strong> {{property.address}}, Unit {{unit.number}}</p>

<p>This Addendum is incorporated into and made a part of the Lease. In the event of any conflict between this
Addendum and the Lease, the terms of this Addendum shall control with respect to insurance matters.</p>

<h3>1. Insurance Requirement</h3>
<p>Tenant is required to obtain and maintain a renters insurance policy (also known as a tenant&rsquo;s or
HO-4 policy) for the entire duration of the Lease, including any renewals or extensions. The insurance policy
must be issued by a company licensed to do business in the State of Minnesota and must remain in force from
the date Tenant takes possession of the Premises through the date Tenant vacates and surrenders the Premises.</p>

<h3>2. Minimum Coverage Requirements</h3>
<p>Tenant&rsquo;s renters insurance policy must provide, at minimum, the following coverage:</p>
<ol>
  <li><strong>Personal Liability Coverage:</strong> A minimum of {{insurance.minCoverage}} per occurrence.
  Personal liability coverage protects Tenant against claims for bodily injury or property damage to others
  caused by Tenant&rsquo;s negligence.</li>
  <li><strong>Personal Property Coverage:</strong> Sufficient coverage to replace Tenant&rsquo;s personal
  belongings in the event of theft, fire, water damage, or other covered peril. Landlord recommends that Tenant
  conduct a personal property inventory to determine an appropriate coverage amount.</li>
  <li><strong>Additional Living Expenses (Loss of Use):</strong> Coverage for temporary housing and related
  expenses if the Premises become uninhabitable due to a covered peril.</li>
</ol>

<h3>3. Additional Insured / Interested Party</h3>
<p>Tenant shall list Landlord as an &ldquo;interested party&rdquo; (also known as &ldquo;certificate holder&rdquo;
or &ldquo;additional interested party&rdquo;) on the insurance policy. This designation does not provide coverage
to Landlord but ensures that Landlord receives written notice from the insurance company in the event the policy
is cancelled, non-renewed, or materially modified.</p>

<p>Landlord&rsquo;s information for the interested party designation:</p>
<p>Name: {{landlord.name}}<br/>
Property: {{property.address}}, Unit {{unit.number}}</p>

<h3>4. Proof of Insurance</h3>
<p>Tenant shall provide Landlord with a certificate of insurance or declarations page as proof of coverage:</p>
<ol>
  <li><strong>Before Move-In:</strong> Tenant must provide proof of insurance at least five (5) days prior to
  the Lease commencement date or at the time of Lease signing, whichever is earlier. Tenant shall not take
  possession of the Premises until proof of insurance has been provided to Landlord.</li>
  <li><strong>Upon Renewal:</strong> Tenant shall provide updated proof of insurance within ten (10) days of
  each policy renewal.</li>
  <li><strong>Upon Request:</strong> Tenant shall provide proof of current insurance within five (5) business
  days of Landlord&rsquo;s written request at any time during the Lease term.</li>
</ol>

<h3>5. Policy Lapse &amp; Failure to Maintain Insurance</h3>
<p>If Tenant&rsquo;s renters insurance policy lapses, is cancelled, or is not renewed, Tenant shall be in
breach of this Addendum and the Lease. Upon learning of a lapse in coverage, Landlord shall provide Tenant
with written notice of the breach. Tenant shall have the following periods to cure:</p>
<ol>
  <li><strong>Initial Cure Period:</strong> Tenant shall have ten (10) days from receipt of written notice to
  obtain replacement coverage meeting the requirements of this Addendum and to provide proof of insurance to
  Landlord.</li>
  <li><strong>Failure to Cure:</strong> If Tenant fails to obtain replacement coverage within the cure period,
  Landlord may, at Landlord&rsquo;s sole discretion:
    <ul>
      <li>Purchase a landlord-placed insurance policy (also known as &ldquo;force-placed&rdquo; insurance) on
      Tenant&rsquo;s behalf and charge the premium cost to Tenant as additional rent. Tenant acknowledges that
      force-placed insurance is typically more expensive than a policy obtained directly by Tenant and may
      provide only limited coverage.</li>
      <li>Pursue the lapse as a material breach of the Lease and take action in accordance with Minnesota
      Statutes &sect; 504B.285, including termination of the Lease after proper notice.</li>
    </ul>
  </li>
</ol>

<h3>6. Landlord&rsquo;s Insurance Disclaimer</h3>
<p>Tenant acknowledges and understands the following:</p>
<ol>
  <li>Landlord&rsquo;s insurance policy covers the building structure and Landlord&rsquo;s property only. It does
  <strong>not</strong> cover Tenant&rsquo;s personal property, personal liability, or additional living expenses.</li>
  <li>In the event of fire, theft, water damage, natural disaster, or other loss, Tenant is solely responsible
  for the replacement of Tenant&rsquo;s personal property.</li>
  <li>Landlord is not responsible for any loss or damage to Tenant&rsquo;s personal property, regardless of cause,
  except to the extent caused by Landlord&rsquo;s negligence.</li>
</ol>

<h3>7. Waiver of Subrogation</h3>
<p>To the extent permitted by their respective insurance policies, Landlord and Tenant each waive any right of
subrogation that the insurer of one party may have against the other party. Both parties agree to request that
their respective insurance carriers include a waiver of subrogation endorsement in their policies, if available
at no additional cost.</p>

<h3>8. Indemnification</h3>
<p>Tenant shall indemnify, defend, and hold harmless Landlord from and against any claims, losses, damages, or
expenses (including reasonable attorney&rsquo;s fees) arising from Tenant&rsquo;s failure to maintain the
required insurance coverage, including but not limited to claims that would have been covered had Tenant
maintained the required policy.</p>

<h3>9. Signatures</h3>
<div class="signature-block">
  <p>By signing below, Tenant acknowledges the requirement to obtain and maintain renters insurance as described
  in this Addendum and agrees to comply with all terms herein.</p>

  <p><strong>LANDLORD:</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{landlord.name}}</p>

  <br/>

  <p><strong>TENANT(S):</strong></p>
  <p>Signature: <span class="signature-line"></span> Date: <span class="date-line"></span></p>
  <p>Printed Name: {{tenant.names}}</p>
</div>
`;
