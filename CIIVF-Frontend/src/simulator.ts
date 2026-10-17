import { ApiRegion, DisasterIntelligenceResponse, PreparednessBudgetLine, SimulatedPreparednessBudget } from './api';

export type SimulationTier = 'YELLOW' | 'ORANGE' | 'RED';

const scenarios: Record<SimulationTier, {
  wind: number;
  pressure: number;
  surge: number;
  score: number;
  radius: number;
  factors: string[];
  tasks: DisasterIntelligenceResponse['ai_analysis']['recommended_tasks'];
  budget: Array<Omit<PreparednessBudgetLine, 'subtotal_inr'>>;
}> = {
  YELLOW: {
    wind: 76,
    pressure: 1001,
    surge: 0.8,
    score: 35,
    radius: 8,
    factors: ['Simulated strong winds: 76 km/h', 'Simulated storm surge: 0.80 m'],
    tasks: [
      { department: 'Municipal Disaster Cell', location: 'Coastal monitoring area', description: 'Verify shelter readiness and publish a preparedness advisory.', priority: 'moderate', sub_team: 'Readiness Team', status_text: 'Simulated' },
      { department: 'PWD Water Supply', location: 'Low-lying roads', description: 'Inspect drainage channels and stage pumps for rapid deployment.', priority: 'low', sub_team: 'Drainage Team', status_text: 'Simulated' },
    ],
    budget: [
      { label: 'Emergency family supply kits', quantity: 250, unit: 'kits', unit_cost_inr: 1800 },
      { label: 'Temporary shelter operations', quantity: 1200, unit: 'person-days', unit_cost_inr: 350 },
      { label: 'Evacuation transport staging', quantity: 40, unit: 'vehicle trips', unit_cost_inr: 6000 },
      { label: 'Pump and drainage readiness', quantity: 12, unit: 'pump-days', unit_cost_inr: 8000 },
    ],
  },
  ORANGE: {
    wind: 101,
    pressure: 988,
    surge: 1.5,
    score: 65,
    radius: 12,
    factors: ['Simulated high winds: 101 km/h', 'Simulated low pressure: 988 hPa', 'Simulated storm surge: 1.50 m'],
    tasks: [
      { department: 'Municipal Disaster Cell', location: 'Coastal and estuary wards', description: 'Open designated shelters and begin targeted resident notifications.', priority: 'high', sub_team: 'Ward Response Teams', status_text: 'Simulated' },
      { department: 'PWD Water Supply', location: 'Flood-prone road crossings', description: 'Pre-position dewatering pumps and barricades at vulnerable crossings.', priority: 'high', sub_team: 'Pump Deployment Team', status_text: 'Simulated' },
      { department: 'Health & EMS', location: 'Shelter network', description: 'Stage ambulance crews and verify emergency supplies at shelters.', priority: 'moderate', sub_team: 'EMS Staging', status_text: 'Simulated' },
    ],
    budget: [
      { label: 'Emergency family supply kits', quantity: 900, unit: 'kits', unit_cost_inr: 1800 },
      { label: 'Temporary shelter operations', quantity: 4500, unit: 'person-days', unit_cost_inr: 350 },
      { label: 'Evacuation transport staging', quantity: 120, unit: 'vehicle trips', unit_cost_inr: 6000 },
      { label: 'Pump and drainage readiness', quantity: 28, unit: 'pump-days', unit_cost_inr: 8000 },
    ],
  },
  RED: {
    wind: 145,
    pressure: 970,
    surge: 2.8,
    score: 95,
    radius: 16,
    factors: ['Simulated very high winds: 145 km/h', 'Simulated very low pressure: 970 hPa', 'Simulated storm surge: 2.80 m'],
    tasks: [
      { department: 'NDRF', location: 'Coastal settlements in the red zone', description: 'Execute the simulated evacuation plan and deploy rescue teams to assigned staging points.', priority: 'critical', sub_team: 'Search & Rescue Unit', status_text: 'Simulated' },
      { department: 'Municipal Disaster Cell', location: 'Red-zone wards', description: 'Activate emergency shelters and coordinate door-to-door evacuation notices.', priority: 'critical', sub_team: 'Ward Incident Leads', status_text: 'Simulated' },
      { department: 'PWD Water Supply', location: 'Critical drainage and embankment assets', description: 'Deploy pumps and inspection crews; report any simulated breach indicators.', priority: 'high', sub_team: 'Infrastructure Response', status_text: 'Simulated' },
      { department: 'Health & EMS', location: 'Red-zone perimeter', description: 'Stage ambulances and establish a medical triage point outside the impact zone.', priority: 'high', sub_team: 'Emergency Medical Team', status_text: 'Simulated' },
    ],
    budget: [
      { label: 'Emergency family supply kits', quantity: 2400, unit: 'kits', unit_cost_inr: 1800 },
      { label: 'Temporary shelter operations', quantity: 12000, unit: 'person-days', unit_cost_inr: 350 },
      { label: 'Evacuation transport staging', quantity: 320, unit: 'vehicle trips', unit_cost_inr: 6000 },
      { label: 'Pump and drainage readiness', quantity: 60, unit: 'pump-days', unit_cost_inr: 8000 },
    ],
  },
};

function buildPreparednessBudget(tier: SimulationTier): SimulatedPreparednessBudget {
  const scenario = scenarios[tier];
  const lines = scenario.budget.map(line => ({
    ...line,
    subtotal_inr: line.quantity * line.unit_cost_inr,
  }));
  const total = lines.reduce((sum, line) => sum + line.subtotal_inr, 0);

  return {
    status: 'SIMULATED',
    currency: 'INR',
    planning_window_hours: 48,
    total_inr: total,
    range_low_inr: Math.round(total * 0.8),
    range_high_inr: Math.round(total * 1.25),
    lines,
    assumptions: [
      'Scenario quantities and unit costs are synthetic demo assumptions, not government-approved rates.',
      'The planning range is 80%–125% of the illustrative subtotal.',
    ],
    government_aid_estimate_inr: null,
    note: 'Mock preparedness operations estimate only. Cash-relief eligibility, official assistance norms, insurance payouts, and fund availability are not configured.',
  };
}

export function createSimulatedIntelligence(
  live: DisasterIntelligenceResponse | null,
  regionKey: string,
  bounds: ApiRegion,
  tier: SimulationTier,
): DisasterIntelligenceResponse {
  const scenario = scenarios[tier];
  const centerLat = (bounds.min_lat + bounds.max_lat) / 2;
  const centerLon = (bounds.min_lon + bounds.max_lon) / 2;
  const timestamp = new Date().toISOString();
  const activeRadius = scenario.radius;
  const zone = (color: 'yellow' | 'orange' | 'red', radius: number, label: string) => ({
    id: `sim-${tier.toLowerCase()}-${color}`,
    label,
    color,
    lat: centerLat,
    lon: centerLon,
    radius_km: radius,
    description: `${label} scenario overlay centered on ${bounds.name}. Simulated, not an official warning boundary.`,
    basis: scenario.factors,
  });

  const riskZones = tier === 'RED'
    ? [zone('yellow', activeRadius * 2.2, 'Yellow watch zone'), zone('orange', activeRadius * 1.45, 'Orange impact zone'), zone('red', activeRadius, 'Red immediate-response zone')]
    : tier === 'ORANGE'
      ? [zone('yellow', activeRadius * 1.8, 'Yellow watch zone'), zone('orange', activeRadius, 'Orange elevated-risk zone')]
      : [zone('yellow', activeRadius, 'Yellow preparedness zone')];

  const insuranceThreshold = live?.insurance_summary.trigger_threshold_m ?? 1.2;
  const triggerMet = scenario.surge >= insuranceThreshold;

  return {
    status: 'success',
    region: regionKey,
    generated_at: timestamp,
    simulation: { tier, label: `${tier} zone scenario` },
    data_quality: {
      ingestion_status: 'SUCCESS',
      telemetry_status: 'AVAILABLE',
      ingestion_error: null,
      telemetry_timestamp: timestamp,
      sources: { meteorological: 'Frontend scenario simulator', history: 'Live API context', forecast: 'Live API context' },
    },
    current_conditions: {
      wind_speed_kmh: scenario.wind,
      pressure_hpa: scenario.pressure,
      storm_surge_meters: scenario.surge,
      alert_status: `SIMULATION_${tier}`,
    },
    risk_assessment: {
      level: tier,
      score: scenario.score,
      factors: scenario.factors,
      method: 'Deterministic frontend scenario fixture',
      official_warning: false,
      note: 'Simulated scenario for demonstration only. This is not a live hazard assessment or official warning.',
    },
    risk_zones: riskZones,
    historical_context: live?.historical_context ?? { primary_analog: null, historical_analogs: [] },
    demography: live?.demography ?? { total_population: null },
    critical_places: live?.critical_places ?? { hospitals: [], shelters: [] },
    insurance_summary: {
      status: 'EVALUATED',
      trigger_met: triggerMet,
      trigger_threshold_m: insuranceThreshold,
      observed_water_depth_m: scenario.surge,
      estimated_payout_cr: null,
      headline: `Simulated depth ${triggerMet ? 'reaches' : 'does not reach'} the configured ${insuranceThreshold.toFixed(1)} m threshold.`,
      coverage_focus: live?.insurance_summary.coverage_focus ?? ['Critical infrastructure', 'Low-lying settlements'],
      note: 'Scenario value for UI testing only. No policy, payout, or transaction is evaluated.',
    },
    preparedness_budget: buildPreparednessBudget(tier),
    ai_analysis: {
      summary: `Demonstration ${tier.toLowerCase()}-risk scenario for ${bounds.name}. All threat measurements and recommendations shown here are simulated.`,
      recommended_tasks: scenario.tasks,
      reasoning_context: scenario.factors,
    },
  };
}