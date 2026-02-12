export const SHARED_UTILITY_DISCLOSURE_TEMPLATE = `
<div class="page-break"></div>
<h1>SHARED UTILITY ARRANGEMENT DISCLOSURE</h1>
<p><em>Required under Minnesota Statute 504B.215</em></p>

<h3>Disclosure of Shared Utility Arrangement</h3>

<p>The landlord discloses that certain utilities serving the rental unit at {{property.address}}, Unit {{unit.number}} are shared with other units or common areas. Minnesota law requires landlords to disclose shared utility arrangements before a tenant signs a lease.</p>

<h3>Shared Utilities</h3>

<p>The following utilities are shared and allocated among tenants as described below:</p>

<table>
  <tr>
    <th>Utility</th>
    <th>Shared With</th>
    <th>Allocation Method</th>
    <th>Estimated Monthly Cost</th>
  </tr>
  <tr>
    <td colspan="4">{{sharedUtilityRows}}</td>
  </tr>
</table>

<h3>Allocation Methods</h3>

<p>Shared utility costs may be allocated using one of the following methods:</p>

<ol type="a">
  <li><strong>Equal Split:</strong> The total utility cost is divided equally among all units sharing the utility.</li>
  <li><strong>Square Footage:</strong> Each unit's share is proportional to the unit's square footage relative to the total square footage of all sharing units.</li>
  <li><strong>Occupancy:</strong> Each unit's share is proportional to the number of authorized occupants.</li>
  <li><strong>Fixed Amount:</strong> Each unit pays a fixed monthly amount as specified in the lease. Any difference between the fixed amount and the actual cost is borne by the landlord.</li>
  <li><strong>Submeter:</strong> Usage is individually metered for each unit, and each tenant pays based on actual usage.</li>
</ol>

<h3>Tenant Rights Under Minnesota Law</h3>

<p>Under Minnesota Statute 504B.215:</p>

<ol>
  <li>Your landlord must disclose the existence of any shared utility arrangement <strong>before</strong> you sign the lease.</li>
  <li>Your landlord must clearly identify which utilities are shared and how costs will be allocated.</li>
  <li>You may not be charged for utility usage by other tenants unless the shared arrangement and allocation method are properly disclosed.</li>
  <li>If your landlord fails to disclose a shared utility arrangement, you may have the right to recover any amounts charged for shared utilities.</li>
</ol>

<h3>Landlord's Obligations</h3>

<p>The landlord agrees to:</p>

<ol type="a">
  <li>Provide tenants with a copy of any shared utility bills upon written request;</li>
  <li>Not profit from the resale of shared utility services (amounts charged must reflect actual costs);</li>
  <li>Provide reasonable advance notice of any changes to the utility allocation method;</li>
  <li>Maintain shared utility systems in proper working order.</li>
</ol>

<h3>Acknowledgment</h3>

<p>By signing below, the tenant acknowledges that the landlord has disclosed the shared utility arrangements described above <strong>prior to</strong> signing the lease agreement.</p>

<table>
  <tr>
    <td width="50%">
      <p>Landlord Signature: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
    <td width="50%">
      <p>Tenant Signature: <span class="signature-line"></span></p>
      <p>Date: <span class="date-line"></span></p>
    </td>
  </tr>
</table>
`;
