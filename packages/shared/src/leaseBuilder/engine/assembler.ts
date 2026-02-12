/**
 * Lease Assembler
 *
 * Class-aware assembly engine that:
 * 1. Loads the correct clause registry based on leaseClass
 * 2. Filters clauses by conditions
 * 3. Applies city overlays (replace/add/remove)
 * 4. Runs validation
 * 5. Orders clauses
 * 6. Renders HTML with placeholder replacement
 * 7. Assembles the final document package
 */

import type {
  LeaseBuilderDraft,
  ClauseDefinition,
  CityOverlay,
  LeasePackageDocument,
  ValidationResult,
} from '../../types/leaseBuilder';
import { filterApplicableClauses, evaluateClauseConditions } from './conditionEvaluator';
import { validateDraft, getValidationErrors, canProceed } from './validator';
import { getCityOverlay } from '../overlays';
import { getValidationRulesForClass } from '../validation';
import { residentialClauseRegistry } from '../residential/clauses';
import { commercialClauseRegistry } from '../commercial/clauses';

// ============================================================================
// PLACEHOLDER RESOLUTION
// ============================================================================

/**
 * Processes conditional blocks and replaces {{placeholder}} tokens with values
 * from a pre-built flat context map. The context should be built by
 * buildTemplateContext() in the service layer, which fetches external data
 * (LLC, property, unit, tenant) and maps all placeholder paths to strings.
 */
export function replacePlaceholders(html: string, context: Record<string, string>): string {
  // 1. Process {{#if key}}...{{/if}} blocks
  let result = html.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, key: string, content: string) => {
      const val = context[key.trim()];
      return (val && val !== '' && val !== 'false' && val !== 'No') ? content : '';
    }
  );

  // 2. Process {{#unless key}}...{{/unless}} blocks
  result = result.replace(
    /\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_match, key: string, content: string) => {
      const val = context[key.trim()];
      return (!val || val === '' || val === 'false' || val === 'No') ? content : '';
    }
  );

  // 3. Replace {{placeholder}} tokens
  result = result.replace(/\{\{([^}#/]+)\}\}/g, (_match, path: string) => {
    return context[path.trim()] ?? '';
  });

  return result;
}

// ============================================================================
// OVERLAY APPLICATION
// ============================================================================

/**
 * Applies overlay rules to a clause list, modifying it in place:
 * - replace_clause: swaps one clause's HTML for another
 * - add_clause: inserts a new clause
 * - remove_clause: removes a clause by ID
 */
export function applyOverlayRules(
  clauses: ClauseDefinition[],
  overlay: CityOverlay,
  draft: LeaseBuilderDraft
): { clauses: ClauseDefinition[]; warnings: string[] } {
  let result = [...clauses];
  const warnings: string[] = [];

  for (const rule of overlay.rules) {
    // Check rule-specific conditions
    if (rule.conditions && !evaluateClauseConditions(draft, rule.conditions)) {
      continue;
    }

    switch (rule.type) {
      case 'replace_clause': {
        if (rule.targetClauseId) {
          const idx = result.findIndex((c) => c.id === rule.targetClauseId);
          const existing = result[idx];
          if (idx !== -1 && rule.replacementClauseId && existing) {
            // The replacement clause content comes from the overlay rule description
            // We keep the original clause but mark it as replaced
            result[idx] = {
              ...existing,
              id: rule.replacementClauseId,
              description: `${existing.description} [Replaced by ${overlay.cityName} overlay: ${rule.description}]`,
            };
          }
        }
        break;
      }

      case 'add_clause': {
        if (rule.additionalClauseId) {
          // Check if not already present
          const exists = result.some((c) => c.id === rule.additionalClauseId);
          if (!exists) {
            result.push({
              id: rule.additionalClauseId!,
              leaseClass: overlay.leaseClass,
              category: 'local_overlay',
              title: rule.description,
              description: `Added by ${overlay.cityName} overlay`,
              htmlContent: `<h3>${rule.description}</h3><p>${rule.description}</p>`,
              isRequired: true,
              placeholders: [],
              sortOrder: 900 + result.length, // place near end
              version: overlay.version,
              lastReviewedDate: overlay.lastReviewedDate,
            });
          }
        }
        break;
      }

      case 'remove_clause': {
        if (rule.targetClauseId) {
          result = result.filter((c) => c.id !== rule.targetClauseId);
        }
        break;
      }

      case 'add_warning': {
        if (rule.warningMessage) {
          warnings.push(rule.warningMessage);
        }
        break;
      }

      // modify_validation is handled by the validation engine, not here
    }
  }

  return { clauses: result, warnings };
}

// ============================================================================
// DOCUMENT ASSEMBLY
// ============================================================================

/**
 * Determines which disclosure templates should be triggered based on draft state.
 */
export function determineTriggeredDisclosures(draft: LeaseBuilderDraft): string[] {
  const disclosures: string[] = [];
  const city = draft.propertyProfile?.city?.toLowerCase() ?? '';
  const isMinneapolis = city === 'minneapolis';
  const isStPaul = city === 'st. paul' || city === 'saint paul' || city === 'st paul';

  if (draft.leaseClass === 'residential') {
    // Always required by MN law
    disclosures.push('disclosure-bed-bug');
    disclosures.push('disclosure-dv-notice');
    disclosures.push('disclosure-tenant-rights');

    // Conditional
    if (draft.propertyProfile?.yearBuilt && draft.propertyProfile.yearBuilt < 1978) {
      disclosures.push('disclosure-lead-paint');
    }
    if (draft.propertyProfile?.hasSharedUtilities) {
      disclosures.push('disclosure-shared-utility');
    }
    if (isMinneapolis) {
      disclosures.push('disclosure-mpls-tenant-protections');
      if (draft.propertyProfile?.minneapolisLicenseStatus) {
        disclosures.push('disclosure-rental-license');
      }
    }
    if (isStPaul && draft.propertyProfile?.stPaulRentStabilization === 'subject') {
      disclosures.push('disclosure-stp-rent-stabilization');
    }
  }

  // Commercial leases currently don't have separate disclosure templates
  // but city overlays may add required clauses

  return disclosures;
}

/**
 * Determines which addenda should be triggered based on draft state.
 */
export function determineTriggeredAddenda(draft: LeaseBuilderDraft): string[] {
  const addenda: string[] = [];

  if (draft.leaseClass === 'residential') {
    if (draft.residential?.policies?.petPolicy === 'allowed_with_restrictions') {
      addenda.push('addendum-pet');
    }
    if (draft.residential?.policies?.smokingPolicy === 'designated_areas') {
      addenda.push('addendum-smoking');
    }
    if (draft.propertyProfile?.hasSharedUtilities) {
      addenda.push('addendum-utilities');
    }
    if (draft.residential?.policies?.rentersInsuranceRequired) {
      addenda.push('addendum-renters-insurance');
    }
    if (draft.residential?.deposit?.useMoveinChecklist) {
      addenda.push('addendum-move-in-checklist');
    }
    if (draft.residential?.policies?.parkingIncluded) {
      addenda.push('addendum-parking');
    }
  }

  if (draft.leaseClass === 'commercial') {
    if (draft.commercial?.useAndBuildout?.tiType === 'work_letter') {
      addenda.push('addendum-work-letter');
    }
    if (draft.commercial?.risk?.personalGuaranteeRequired) {
      addenda.push('addendum-personal-guarantee');
    }
    if (draft.commercial?.financial?.camEnabled) {
      addenda.push('addendum-cam-reconciliation');
    }
    if (draft.commercial?.financial?.escalationType === 'step_schedule') {
      addenda.push('addendum-rent-step-schedule');
    }
  }

  return addenda;
}

// ============================================================================
// MAIN ASSEMBLY FUNCTION
// ============================================================================

export interface AssemblyResult {
  success: boolean;
  documents: LeasePackageDocument[];
  clausesIncluded: string[];
  overlaysApplied: string[];
  validationResults: ValidationResult[];
  warnings: string[];
  errors: string[];
}

/**
 * Assembles a complete lease package from a draft.
 *
 * Pipeline:
 * 1. Load clause registry for lease class
 * 2. Run validation rules
 * 3. Filter applicable clauses by conditions
 * 4. Check for city overlay → apply overlay rules
 * 5. Order clauses by sortOrder
 * 6. Render HTML with placeholder replacement
 * 7. Build document list (core lease + disclosures + addenda)
 */
export function assembleLease(draft: LeaseBuilderDraft, context: Record<string, string>): AssemblyResult {
  const warnings: string[] = [];
  const overlaysApplied: string[] = [];

  // 1. Load clause registry
  const registry = draft.leaseClass === 'residential'
    ? residentialClauseRegistry
    : commercialClauseRegistry;

  // 2. Run validation
  const validationRules = getValidationRulesForClass(draft.leaseClass);
  const validationResults = validateDraft(draft, validationRules);

  if (!canProceed(validationResults)) {
    const validationErrors = getValidationErrors(validationResults);
    return {
      success: false,
      documents: [],
      clausesIncluded: [],
      overlaysApplied: [],
      validationResults,
      warnings: [],
      errors: validationErrors.map((e) => `${e.field}: ${e.message}`),
    };
  }

  // 3. Filter applicable clauses
  let applicableClauses = filterApplicableClauses(draft, registry);

  // 4. Apply city overlay if applicable
  const city = draft.propertyProfile?.city ?? '';
  const overlay = getCityOverlay(draft.leaseClass, city);

  if (overlay) {
    overlaysApplied.push(overlay.id);
    const overlayResult = applyOverlayRules(applicableClauses, overlay, draft);
    applicableClauses = overlayResult.clauses;
    warnings.push(...overlayResult.warnings);
  }

  // 5. Sort clauses by sortOrder
  applicableClauses.sort((a, b) => a.sortOrder - b.sortOrder);

  // 6. Render clause HTML with placeholders replaced
  const renderedClauses = applicableClauses.map((clause) => ({
    ...clause,
    htmlContent: replacePlaceholders(clause.htmlContent, context),
  }));

  // 7. Build documents
  const documents: LeasePackageDocument[] = [];
  const clauseIds = renderedClauses.map((c) => c.id);

  // Core lease document
  const coreClauseHtml = renderedClauses.map((c) => c.htmlContent).join('\n\n');
  documents.push({
    type: 'core_lease',
    title: draft.leaseClass === 'residential'
      ? 'Minnesota Residential Lease Agreement'
      : 'Minnesota Commercial Lease Agreement',
    htmlContent: coreClauseHtml,
    pageOrder: 1,
    requiredByLaw: true,
    clauseIds,
  });

  // Disclosures
  const triggeredDisclosures = determineTriggeredDisclosures(draft);
  let pageOrder = 2;

  for (const disclosureId of triggeredDisclosures) {
    documents.push({
      type: 'disclosure',
      title: formatDisclosureTitle(disclosureId),
      htmlContent: '', // Will be filled by the service layer with actual template content
      pageOrder: pageOrder++,
      requiredByLaw: true,
      triggeredBy: disclosureId,
      clauseIds: [disclosureId],
    });
  }

  // Addenda
  const triggeredAddenda = determineTriggeredAddenda(draft);

  for (const addendumId of triggeredAddenda) {
    documents.push({
      type: addendumId.includes('checklist') ? 'checklist' : 'addendum',
      title: formatAddendumTitle(addendumId),
      htmlContent: '', // Will be filled by the service layer with actual template content
      pageOrder: pageOrder++,
      requiredByLaw: false,
      triggeredBy: addendumId,
      clauseIds: [addendumId],
    });
  }

  return {
    success: true,
    documents,
    clausesIncluded: clauseIds,
    overlaysApplied,
    validationResults,
    warnings,
    errors: [],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDisclosureTitle(id: string): string {
  const titles: Record<string, string> = {
    'disclosure-lead-paint': 'Lead-Based Paint Disclosure',
    'disclosure-bed-bug': 'Bed Bug Disclosure',
    'disclosure-dv-notice': 'Domestic Violence Notice',
    'disclosure-tenant-rights': 'Minnesota Tenant Rights Summary',
    'disclosure-shared-utility': 'Shared Utility Disclosure',
    'disclosure-mpls-tenant-protections': 'Minneapolis Tenant Protections Disclosure',
    'disclosure-rental-license': 'Rental License Disclosure',
    'disclosure-stp-rent-stabilization': 'St. Paul Rent Stabilization Disclosure',
  };
  return titles[id] ?? id;
}

function formatAddendumTitle(id: string): string {
  const titles: Record<string, string> = {
    'addendum-pet': 'Pet Addendum',
    'addendum-smoking': 'Smoking Policy Addendum',
    'addendum-utilities': 'Shared Utility Addendum',
    'addendum-renters-insurance': 'Renters Insurance Addendum',
    'addendum-move-in-checklist': 'Move-In/Move-Out Checklist',
    'addendum-parking': 'Parking Addendum',
    'addendum-work-letter': 'Work Letter Agreement',
    'addendum-personal-guarantee': 'Personal Guarantee',
    'addendum-cam-reconciliation': 'CAM Reconciliation Addendum',
    'addendum-rent-step-schedule': 'Rent Step Schedule',
  };
  return titles[id] ?? id;
}
