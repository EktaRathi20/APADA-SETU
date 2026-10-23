import type { ClimateAlert } from './alerts';
import type { VerifiedRoute } from './domain';

export interface DispatchChatRequest {
  query: string;
  region: string;
}

export interface DispatchChatResponse {
  text: string;
  verifiedRoute: VerifiedRoute;
}

export interface ApiRegion {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
  name: string;
}

export interface PopulationResponse {
  timestamp: string;
  region_target: string;
  total_population: number | null;
  source_error?: string;
}

export interface ForecastDayResponse {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  condition: string;
}

export interface ForecastResponse {
  region_target: string;
  latitude: number;
  longitude: number;
  forecast: ForecastDayResponse[];
}

export interface FacilityResponse {
  name: string;
  address: string | null;
  lat: number | null;
  lon: number | null;
}

export interface InfrastructureResponse {
  hospitals: FacilityResponse[];
  shelters: FacilityResponse[];
  source_errors?: Record<string, string>;
}

export interface CurrentConditionsResponse {
  timestamp: string;
  region_target: string;
  temperature_c: number | null;
  condition: string | null;
  wind_speed_kmh: number | null;
  wind_direction: string | null;
  pressure_hpa: number | null;
  relative_humidity_percent: number | null;
}

export interface HistoricalEventResponse {
  matched_cyclone: string;
  historical_peak_wind_kmh: number | null;
  historical_surge_meters: number | null;
  closest_approach_km: number;
  source: string;
  reference_period: {
    start_date: string;
    end_date: string;
  };
}

export interface HistoricalResponse {
  timestamp: string;
  region_target: string;
  source: string;
  source_url: string;
  total_historical_events_analyzed: number;
  historical_analogs: HistoricalEventResponse[];
}

export interface WhatsAppConfigurationResponse {
  verification_configured: boolean;
  delivery_configured: boolean;
}

export interface SimulatorBroadcastResponse {
  alert: ClimateAlert;
  whatsapp_preview: string;
  channels: {
    socket_io: 'broadcasted';
    whatsapp: 'queued' | 'not_configured' | 'not_requested';
  };
}

export interface DisasterRiskZone {
  id: string;
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'green';
  lat: number | null;
  lon: number | null;
  radius_km: number;
  description?: string;
  basis?: string[];
}

export interface DisasterInsuranceSummary {
  status: 'UNAVAILABLE' | 'EVALUATED';
  trigger_met: boolean | null;
  trigger_threshold_m: number | null;
  observed_water_depth_m: number | null;
  estimated_payout_cr: number | null;
  headline: string;
  coverage_focus: string[];
  note?: string;
}

export interface PreparednessBudgetLine {
  label: string;
  quantity: number;
  unit: string;
  unit_cost_inr: number;
  subtotal_inr: number;
}

export interface SimulatedPreparednessBudget {
  status: 'SIMULATED';
  currency: 'INR';
  planning_window_hours: number;
  total_inr: number;
  range_low_inr: number;
  range_high_inr: number;
  lines: PreparednessBudgetLine[];
  assumptions: string[];
  government_aid_estimate_inr: null;
  note: string;
}

export interface DisasterRecommendedTask {
  department: string;
  location: string;
  description: string;
  priority?: 'critical' | 'high' | 'moderate' | 'low' | string;
  sub_team?: string;
  status_text?: string;
}

export interface DisasterIntelligenceResponse {
  status: string;
  region: string;
  generated_at: string;
  simulation?: {
    tier: 'YELLOW' | 'ORANGE' | 'RED';
    label: string;
  };
  data_quality: {
    ingestion_status: 'SUCCESS' | 'FAILED' | string;
    telemetry_status: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_CURRENT_MEASUREMENTS' | string;
    ingestion_error: string | null;
    telemetry_timestamp: string | null;
    sources: Record<string, string | null>;
  };
  current_conditions: {
    wind_speed_kmh: number | null;
    pressure_hpa: number | null;
    storm_surge_meters: number | null;
    alert_status: string;
  };
  risk_assessment: {
    level: string;
    score: number;
    factors: string[];
    method: string;
    official_warning: boolean;
    note: string;
  };
  risk_zones: DisasterRiskZone[];
  historical_context: {
    primary_analog: string | null;
    historical_analogs: Array<Record<string, unknown>>;
  };
  demography: {
    total_population?: number | null;
    [key: string]: unknown;
  };
  critical_places: {
    hospitals?: Array<{ name: string; address?: string | null; lat?: number | null; lon?: number | null }>;
    shelters?: Array<{ name: string; address?: string | null; lat?: number | null; lon?: number | null }>;
    source_errors?: Record<string, string>;
    [key: string]: unknown;
  };
  insurance_summary: DisasterInsuranceSummary;
  preparedness_budget?: SimulatedPreparednessBudget;
  ai_analysis: {
    summary: string | null;
    recommended_tasks: DisasterRecommendedTask[];
    reasoning_context: string[];
  };
}

export interface RegionResponses {
  population: PopulationResponse | null;
  forecast: ForecastResponse | null;
  infrastructure: InfrastructureResponse | null;
  currentConditions: CurrentConditionsResponse | null;
  disasterIntelligence: DisasterIntelligenceResponse | null;
  currentConditionsError: string | null;
  disasterIntelligenceError: string | null;
}
