/**
 * Lease Builder Constants
 *
 * Template versions, labels, and configuration values used across the system.
 */

// Template versioning — increment when legal content changes
export const TEMPLATE_VERSIONS = {
  MN_RESIDENTIAL_CORE: '1.0.0',
  MN_COMMERCIAL_CORE: '1.0.0',
  MPLS_RESIDENTIAL_OVERLAY: '1.0.0',
  MPLS_COMMERCIAL_OVERLAY: '1.0.0',
  STP_RESIDENTIAL_OVERLAY: '1.0.0',
  STP_COMMERCIAL_OVERLAY: '1.0.0',
} as const;

// Cities that have overlays
export const OVERLAY_CITIES = ['Minneapolis', 'St. Paul'] as const;
export type OverlayCity = (typeof OVERLAY_CITIES)[number];

// MN statutory limits
export const MN_LIMITS = {
  /** Maximum late fee percentage allowed under MN law */
  MAX_LATE_FEE_PERCENT: 8,
  /** Days landlord has to return security deposit */
  DEPOSIT_RETURN_DAYS: 21,
  /** Year threshold for lead-based paint disclosure */
  LEAD_PAINT_YEAR_THRESHOLD: 1978,
} as const;

// St. Paul rent stabilization
export const STP_RENT_STABILIZATION = {
  /** Maximum annual rent increase percentage (or CPI, whichever is greater) */
  MAX_ANNUAL_INCREASE_PERCENT: 3,
  /** Required advance notice days for rent increase */
  RENT_INCREASE_NOTICE_DAYS: 90,
} as const;

// Human-readable labels
export const UTILITY_LABELS: Record<string, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  sewer: 'Sewer',
  trash: 'Trash',
  recycling: 'Recycling',
  internet: 'Internet',
  cable: 'Cable/TV',
  phone: 'Phone',
  snow_removal: 'Snow Removal',
  lawn_care: 'Lawn Care',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online_portal: 'Online Portal',
  ach: 'ACH / Bank Transfer',
  check: 'Personal Check',
  money_order: 'Money Order',
  cashiers_check: "Cashier's Check",
  cash: 'Cash',
};

export const ALLOCATION_METHOD_LABELS: Record<string, string> = {
  rubs_sqft: 'RUBS (by Square Footage)',
  rubs_occupants: 'RUBS (by Occupant Count)',
  rubs_equal: 'RUBS (Equal Split)',
  submeter: 'Submetered',
  fixed_amount: 'Fixed Monthly Amount',
};

export const TENANT_MAINTENANCE_LABELS: Record<string, string> = {
  lawn_care: 'Lawn Care',
  snow_removal: 'Snow Removal',
  hvac_filters: 'HVAC Filter Replacement',
  smoke_detector_batteries: 'Smoke Detector Batteries',
  gutter_cleaning: 'Gutter Cleaning',
  pest_control: 'Pest Control',
};

export const PROHIBITED_ACTIVITY_LABELS: Record<string, string> = {
  short_term_rental: 'Short-Term Rentals (Airbnb, VRBO)',
  illegal_activity: 'Illegal Activity',
  home_business: 'Home Business Operations',
  vehicle_repair: 'Vehicle Repair on Premises',
  outdoor_storage: 'Outdoor Storage of Materials',
  satellite_dish_without_approval: 'Satellite Dish Installation Without Approval',
};

export const COMMERCIAL_MAINTENANCE_LABELS: Record<string, string> = {
  structural: 'Structural Elements',
  roof: 'Roof',
  exterior_walls: 'Exterior Walls',
  common_areas: 'Common Areas',
  interior: 'Interior Premises',
  non_structural: 'Non-Structural Elements',
  fixtures_equipment: 'Fixtures & Equipment',
  hvac: 'HVAC Systems',
  plumbing: 'Plumbing',
  electrical: 'Electrical Systems',
};

export const ESCALATION_TYPE_LABELS: Record<string, string> = {
  fixed_amount: 'Fixed Dollar Amount Increase',
  fixed_percentage: 'Fixed Percentage Increase',
  cpi: 'CPI Adjustment',
  step_schedule: 'Step Schedule (Year-by-Year)',
  none: 'No Escalation',
};

export const COMMERCIAL_LEASE_TYPE_LABELS: Record<string, string> = {
  nnn: 'Triple Net (NNN)',
  gross: 'Gross Lease',
  modified_gross: 'Modified Gross',
};
