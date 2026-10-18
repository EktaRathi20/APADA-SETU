import type { ApiRegion, RegionResponses } from '@/types/api';
import { CityLocation, MapPOI } from '@/types/domain';

export const formatCoordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

export const buildCity = (
  id: string,
  region: ApiRegion,
  responses: RegionResponses | null,
): CityLocation => {
  const forecast = responses?.forecast?.forecast ?? [];
  const averageHigh = forecast.length
    ? Math.round(forecast.reduce((sum, day) => sum + day.max_temp_c, 0) / forecast.length)
    : null;
  const averageLow = forecast.length
    ? Math.round(forecast.reduce((sum, day) => sum + day.min_temp_c, 0) / forecast.length)
    : null;
  const population = responses?.population?.total_population;
  const assessment = responses?.disasterIntelligence?.risk_assessment;
  const level = assessment?.level?.toUpperCase();
  const cityRiskLevel: CityLocation['riskLevel'] = level === 'RED'
    ? 'Red'
    : level === 'ORANGE'
      ? 'Orange'
      : level === 'YELLOW'
        ? 'Moderate'
        : 'Normal';
  const facilityErrors = Object.values(responses?.infrastructure?.source_errors ?? {}).join(' ');
  const sources = [
    {
      label: 'Population data',
      available: population !== null && population !== undefined && !responses?.population?.source_error,
      detail: responses?.population?.source_error,
    },
    { label: 'Weather forecast', available: responses?.forecast !== null && responses?.forecast !== undefined },
    {
      label: 'Current conditions',
      available: responses?.currentConditions !== null && responses?.currentConditions !== undefined,
      detail: responses?.currentConditionsError ?? undefined,
    },
    {
      label: 'Hospitals and shelters',
      available: responses?.infrastructure !== null && responses?.infrastructure !== undefined && Object.keys(responses.infrastructure.source_errors ?? {}).length === 0,
      detail: facilityErrors || undefined,
    },
  ];

  return {
    id,
    name: region.name,
    region: region.name,
    country: 'India',
    lat: (region.min_lat + region.max_lat) / 2,
    lng: (region.min_lon + region.max_lon) / 2,
    coordinatesFormatted: `${formatCoordinate((region.min_lat + region.max_lat) / 2, 'N', 'S')}, ${formatCoordinate((region.min_lon + region.max_lon) / 2, 'E', 'W')}`,
    population: population ?? 0,
    populationFormatted: population == null ? 'Unavailable' : new Intl.NumberFormat('en-IN').format(population),
    currentTemp: responses?.currentConditions?.temperature_c ?? 0,
    currentWeather: responses?.currentConditions?.condition ?? 'Unavailable',
    tempRangeAvg: averageHigh === null || averageLow === null ? 'Unavailable' : `${averageHigh}° / ${averageLow}°C`,
    forecastSummary: forecast[0]?.condition ?? 'Forecast unavailable',
    riskScore: assessment?.score ?? 0,
    riskLevel: cityRiskLevel,
    officialWarning: {
      agency: assessment?.official_warning ? 'Backend warning' : 'Risk screening',
      level: assessment?.level ?? 'Unavailable',
      title: assessment?.note ?? 'No warning or risk assessment returned by the API.',
      validity: '',
      details: assessment?.factors.join(' · ') ?? '',
    },
    operationalRisk: { score: assessment?.score ?? 0, level: assessment?.level ?? 'Unavailable', factors: assessment?.factors ?? [] },
    aiPreparednessBrief: {
      summary: responses?.disasterIntelligence?.ai_analysis.summary ?? 'AI preparedness analysis is unavailable.',
      detailedPlan: responses?.disasterIntelligence?.ai_analysis.recommended_tasks.map(task => task.description) ?? [],
      rationale: responses?.disasterIntelligence?.ai_analysis.reasoning_context ?? [],
    },
    evidenceQuality: {
      rating: sources.every(source => source.available) ? 'CONNECTED' : 'PARTIAL',
      items: sources,
      lastAssessment: 'Current API response',
    },
  };
};

export const buildMapPois = (responses: RegionResponses | null, region: ApiRegion): MapPOI[] => {
  const intelligenceResources = responses?.disasterIntelligence?.critical_places;
  const hasIntelligenceFacilities = (intelligenceResources?.hospitals?.length ?? 0) > 0
    || (intelligenceResources?.shelters?.length ?? 0) > 0;
  const resources = hasIntelligenceFacilities || !responses?.infrastructure
    ? intelligenceResources
    : responses.infrastructure;
  if (!resources) return [];
  const project = (facility: { name: string; address?: string | null; lat?: number | null; lon?: number | null }, type: 'shelter' | 'hospital', index: number): MapPOI | null => {
    if (facility.lat == null || facility.lon == null) return null;
    return {
      id: `${type}-${index}-${facility.name}`,
      name: facility.name,
      type,
      lat: facility.lat,
      lon: facility.lon,
      x: Math.max(4, Math.min(96, ((facility.lon - region.min_lon) / (region.max_lon - region.min_lon)) * 100)),
      y: Math.max(4, Math.min(96, ((region.max_lat - facility.lat) / (region.max_lat - region.min_lat)) * 100)),
      status: 'unknown',
      details: facility.address ?? 'Address not provided',
    };
  };
  return [
    ...(resources.shelters ?? []).map((facility, index) => project(facility, 'shelter', index)),
    ...(resources.hospitals ?? []).map((facility, index) => project(facility, 'hospital', index)),
  ].filter((poi): poi is MapPOI => poi !== null);
};
