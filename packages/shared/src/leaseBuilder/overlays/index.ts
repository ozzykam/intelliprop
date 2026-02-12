/**
 * Overlay Registry
 *
 * Central registry of all city overlays, organized by lease class.
 */

import type { CityOverlay, LeaseClass } from '../../types/leaseBuilder';
import { minneapolisResidentialOverlay } from './residential/minneapolis';
import { stPaulResidentialOverlay } from './residential/stpaul';
import { minneapolisCommercialOverlay } from './commercial/minneapolis';
import { stPaulCommercialOverlay } from './commercial/stpaul';

const residentialOverlays: CityOverlay[] = [
  minneapolisResidentialOverlay,
  stPaulResidentialOverlay,
];

const commercialOverlays: CityOverlay[] = [
  minneapolisCommercialOverlay,
  stPaulCommercialOverlay,
];

/**
 * Get the city overlay for a given lease class and city name.
 * Returns undefined if no overlay exists for that city.
 */
export function getCityOverlay(
  leaseClass: LeaseClass,
  cityName: string
): CityOverlay | undefined {
  const normalizedCity = cityName.trim().toLowerCase();
  const overlays = leaseClass === 'residential' ? residentialOverlays : commercialOverlays;

  return overlays.find((overlay) => {
    const overlayCity = overlay.cityName.toLowerCase();
    // Handle common variations
    if (normalizedCity === 'minneapolis') return overlayCity === 'minneapolis';
    if (normalizedCity === 'st. paul' || normalizedCity === 'saint paul' || normalizedCity === 'st paul') {
      return overlayCity === 'st. paul';
    }
    return overlayCity === normalizedCity;
  });
}

/**
 * Check if a city has an overlay for a given lease class.
 */
export function hasOverlay(leaseClass: LeaseClass, cityName: string): boolean {
  return getCityOverlay(leaseClass, cityName) !== undefined;
}

// Re-export individual overlays
export { minneapolisResidentialOverlay } from './residential/minneapolis';
export { stPaulResidentialOverlay } from './residential/stpaul';
export { minneapolisCommercialOverlay } from './commercial/minneapolis';
export { stPaulCommercialOverlay } from './commercial/stpaul';
