/**
 * Commercial Clause Registry
 */

import type { ClauseDefinition } from '../../../types/leaseBuilder';
import { commercialCoreClauses } from './core';
import { commercialRentClauses } from './rent';
import { commercialCamClauses } from './cam';
import { commercialDepositClauses } from './deposit';
import { commercialPermittedUseClauses } from './permittedUse';
import { commercialTiClauses } from './tenantImprovements';
import { commercialMaintenanceClauses } from './maintenance';
import { commercialUtilityClauses } from './utilities';
import { commercialInsuranceClauses } from './insurance';
import { commercialIndemnificationClauses } from './indemnification';
import { commercialAssignmentClauses } from './assignment';
import { commercialPersonalGuaranteeClauses } from './personalGuarantee';
import { commercialDefaultClauses } from './default';
import { commercialHoldoverClauses } from './holdover';
import { commercialEnvironmentalClauses } from './environmental';
import { commercialAdaClauses } from './ada';
import { commercialCasualtyClauses } from './casualty';
import { commercialSignageClauses } from './signage';
import { commercialSubordinationClauses } from './subordination';
import { commercialMiscProvisionsClauses } from './miscProvisions';
import { commercialAlterationsClauses } from './alterations';

export const commercialClauseRegistry: ClauseDefinition[] = [
  ...commercialCoreClauses,
  ...commercialRentClauses,
  ...commercialCamClauses,
  ...commercialDepositClauses,
  ...commercialPermittedUseClauses,
  ...commercialTiClauses,
  ...commercialAlterationsClauses,
  ...commercialMaintenanceClauses,
  ...commercialUtilityClauses,
  ...commercialInsuranceClauses,
  ...commercialIndemnificationClauses,
  ...commercialAssignmentClauses,
  ...commercialPersonalGuaranteeClauses,
  ...commercialDefaultClauses,
  ...commercialHoldoverClauses,
  ...commercialEnvironmentalClauses,
  ...commercialAdaClauses,
  ...commercialCasualtyClauses,
  ...commercialSignageClauses,
  ...commercialSubordinationClauses,
  ...commercialMiscProvisionsClauses,
].sort((a, b) => a.sortOrder - b.sortOrder);

export { commercialCoreClauses } from './core';
export { commercialRentClauses } from './rent';
export { commercialCamClauses } from './cam';
export { commercialDepositClauses } from './deposit';
export { commercialPermittedUseClauses } from './permittedUse';
export { commercialTiClauses } from './tenantImprovements';
export { commercialMaintenanceClauses } from './maintenance';
export { commercialUtilityClauses } from './utilities';
export { commercialInsuranceClauses } from './insurance';
export { commercialIndemnificationClauses } from './indemnification';
export { commercialAssignmentClauses } from './assignment';
export { commercialPersonalGuaranteeClauses } from './personalGuarantee';
export { commercialDefaultClauses } from './default';
export { commercialHoldoverClauses } from './holdover';
export { commercialEnvironmentalClauses } from './environmental';
export { commercialAdaClauses } from './ada';
export { commercialCasualtyClauses } from './casualty';
export { commercialSignageClauses } from './signage';
export { commercialSubordinationClauses } from './subordination';
export { commercialMiscProvisionsClauses } from './miscProvisions';
export { commercialAlterationsClauses } from './alterations';
