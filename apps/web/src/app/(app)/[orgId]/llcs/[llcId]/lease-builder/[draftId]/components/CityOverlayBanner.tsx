'use client';

interface CityOverlayBannerProps {
  city: string;
  leaseClass: 'residential' | 'commercial';
}

const CITY_MESSAGES: Record<string, Record<string, string>> = {
  residential: {
    minneapolis:
      'This property is in Minneapolis. Additional tenant protections, just cause eviction rules, and rental license requirements apply.',
    'st. paul':
      'This property is in St. Paul. Rent stabilization (3% annual cap), just cause eviction protections, and notice requirements apply.',
  },
  commercial: {
    minneapolis:
      'This property is in Minneapolis. Zoning confirmation, signage compliance, and enhanced environmental provisions may apply.',
    'st. paul':
      'This property is in St. Paul. Zoning confirmation and additional restaurant/liquor licensing provisions may apply.',
  },
};

export default function CityOverlayBanner({ city, leaseClass }: CityOverlayBannerProps) {
  const normalizedCity = city?.toLowerCase().trim();
  const message = CITY_MESSAGES[leaseClass]?.[normalizedCity];

  if (!message) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
      <span className="font-medium">City Overlay Active:</span> {message}
    </div>
  );
}
