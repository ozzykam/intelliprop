/**
 * Residential Clause Registry
 */

import type { ClauseDefinition } from '../../../types/leaseBuilder';
import { residentialCoreClauses } from './core';
import { residentialRentClauses } from './rent';
import { residentialDepositClauses } from './deposit';
import { residentialUtilityClauses } from './utilities';
import { residentialOccupancyClauses } from './occupancy';
import { residentialPetClauses } from './pets';
import { residentialSmokingClauses } from './smoking';
import { residentialInsuranceClauses } from './insurance';
import { residentialParkingClauses } from './parking';
import { residentialMaintenanceClauses } from './maintenance';
import { residentialTerminationClauses } from './termination';
import { residentialDisclosureClauses } from './disclosures';

export const residentialClauseRegistry: ClauseDefinition[] = [
  ...residentialCoreClauses,
  ...residentialRentClauses,
  ...residentialDepositClauses,
  ...residentialUtilityClauses,
  ...residentialOccupancyClauses,
  ...residentialPetClauses,
  ...residentialSmokingClauses,
  ...residentialInsuranceClauses,
  ...residentialParkingClauses,
  ...residentialMaintenanceClauses,
  ...residentialTerminationClauses,
  ...residentialDisclosureClauses,
].sort((a, b) => a.sortOrder - b.sortOrder);

// Re-export individual clause sets
export { residentialCoreClauses } from './core';
export { residentialRentClauses } from './rent';
export { residentialDepositClauses } from './deposit';
export { residentialUtilityClauses } from './utilities';
export { residentialOccupancyClauses } from './occupancy';
export { residentialPetClauses } from './pets';
export { residentialSmokingClauses } from './smoking';
export { residentialInsuranceClauses } from './insurance';
export { residentialParkingClauses } from './parking';
export { residentialMaintenanceClauses } from './maintenance';
export { residentialTerminationClauses } from './termination';
export { residentialDisclosureClauses } from './disclosures';
