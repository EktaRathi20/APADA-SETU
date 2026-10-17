export type OperationalMode = 
  | 'overview'       // The complete integrated view shown in screenshot
  | 'baseline'       // Safe Mode: Baseline intelligence & Mangrove layers
  | 'threat'         // Amber Mode: Threat detection, T-48 Countdown, What-If slider
  | 'tasks'          // Task management & Evacuation, Kanban board, Ward 17 & corridor
  | 'landfall'       // Red Mode: Landfall rescue, Critical Alert banner, Dispatch Chat
  | 'recovery'       // Insurance & Recovery, Before/After flood slider, Parametric funds, SDG
  | 'simulator';     // Interactive risk scenario sandbox

export type UserRole = 
  | 'municipal_commissioner'
  | 'disaster_officer'
  | 'ward_engineer'
  | 'insurance_underwriter';

export interface CityLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  coordinatesFormatted: string;
  population: number;
  populationFormatted: string;
  currentTemp: number;
  currentWeather: string;
  tempRangeAvg: string;
  forecastSummary: string;
  riskScore: number;
  riskLevel: 'Normal' | 'Moderate' | 'Orange' | 'Red';
  officialWarning: {
    agency: string;
    level: string;
    title: string;
    validity: string;
    details: string;
  };
  operationalRisk: {
    score: number;
    level: string;
    factors: string[];
  };
  aiPreparednessBrief: {
    summary: string;
    detailedPlan: string[];
    rationale: string[];
  };
  evidenceQuality: {
    rating: string;
    items: { label: string; available: boolean; detail?: string }[];
    lastAssessment: string;
  };
}

export interface WeatherDay {
  day: string;
  date: string;
  high: number;
  low: number;
  rainProb: number;
  condition: string;
  temp: number;
  rainfallMm: number;
}

export interface MapPOI {
  id: string;
  name: string;
  type: 'shelter' | 'hospital' | 'police' | 'fire' | 'water' | 'transport';
  x: number; // percentage on map SVG
  y: number;
  lat?: number;
  lon?: number;
  capacity?: number;
  status: 'safe' | 'at_risk' | 'operational' | 'unknown';
  details?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  department: 'NDRF' | 'Municipal Corp' | 'PWD Water Supply' | 'Health & EMS' | 'Power Utility';
  priority: 'Critical' | 'High' | 'Medium';
  status: 'pending' | 'in_progress' | 'done';
  ward: string;
  assignee: string;
  timeRemaining?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'officer' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  verifiedRoute?: {
    origin: string;
    destination: string;
    clearanceStatus: 'VERIFIED_CLEAR' | 'CAUTION_RESTRICTED' | 'IMPASSABLE_FLOOD';
    waterDepth: string;
    recommendedPath: string;
    waypoints: string[];
    sensorVerification: string;
    validityWindow: string;
  };
}

export interface WhatIfState {
  windSpeedKmH: number; // 110 to 170
  inundationDepthM: number;
  stormSurgeHeightM: number;
  displacedPopulation: number;
  severelyImpactedWards: string[];
  substationsAtRisk: number;
  dischargeSurgeRate: string;
}

export interface ShelterResource {
  id: string;
  name: string;
  distance: string;
  capacity: number;
  available: number;
  status: 'Safe' | 'Moderate' | 'At Risk';
}

export interface EvacuationRoute {
  id: string;
  title: string;
  destination: string;
  distance: string;
  estimatedTime: string;
  riskStatus: 'Safe' | 'Moderate' | 'Risky';
  details: string;
}

export interface SDGAlignment {
  id: number;
  title: string;
  badge: string;
  description: string;
  progressPercentage: number;
  targetMetric: string;
  status: 'Compliant' | 'On Track' | 'Accelerated';
}

export interface HistoricalDisaster {
  id: string;
  name: string;
  date: string;
  year: number;
  category: string;
  hazardType: 'Super Cyclone' | 'Extremely Severe' | 'Very Severe' | 'Severe Cyclonic Storm';
  peakGusts: string;
  windSpeedMaxKmH: number;
  stormSurge: string;
  surgeHeightM: number;
  impactedAreas: string;
  inundatedWardsCount: number;
  fatalities: string;
  displaced: string;
  economicDamage: string;
  description: string;
  lessonsApplied: string[];
  satelliteTag: string;
  severityColor: 'red' | 'orange' | 'amber';
}
