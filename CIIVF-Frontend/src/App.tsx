import React, { useEffect, useState } from 'react';
import { 
  BellRing, CloudRain, LoaderCircle, MapPin, X
} from 'lucide-react';
import { MapPOI, OperationalMode, CityLocation } from './types';
import { api, ApiRegion, CurrentConditionsResponse, DisasterIntelligenceResponse, ForecastResponse, HistoricalResponse, InfrastructureResponse, PopulationResponse } from './api';
import { ClimateAlert } from './climateAlerts';

// Layout & Authentication Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage, OfficerUser, OPERATIONAL_ROLES } from './components/LoginPage';

// View Pages
import { HistoricalDisastersView } from './components/HistoricalDisastersView';
import { ClimateAlertInbox } from './components/ClimateAlertInbox';

// Overview Dashboard Components
import { AssessmentCards } from './components/AssessmentCards';
import { MapComponent } from './components/MapComponent';
import { WeatherHazardChart } from './components/WeatherHazardChart';
import { RightColumnCards } from './components/RightColumnCards';
import { BottomRowCards } from './components/BottomRowCards';

// Project Flow Mode Components
import { BaselineModeView } from './components/modes/BaselineModeView';
import { ThreatDetectionModeView } from './components/modes/ThreatDetectionModeView';
import { TaskEvacuationModeView } from './components/modes/TaskEvacuationModeView';
import { LandfallRescueModeView } from './components/modes/LandfallRescueModeView';
import { InsuranceRecoveryModeView } from './components/modes/InsuranceRecoveryModeView';
import { SimulatorModeView } from './components/modes/SimulatorModeView';
import { SettingsModal } from './components/modals/SettingsModal';
import { EvacuationModal } from './components/modals/EvacuationModal';
import { useClimateAlerts } from './useClimateAlerts';
import { createSimulatedIntelligence, SimulationTier } from './simulator';

interface RegionResponses {
  population: PopulationResponse | null;
  forecast: ForecastResponse | null;
  infrastructure: InfrastructureResponse | null;
  currentConditions: CurrentConditionsResponse | null;
  disasterIntelligence: DisasterIntelligenceResponse | null;
  currentConditionsError: string | null;
  disasterIntelligenceError: string | null;
}

const formatCoordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

const buildCity = (
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

const buildMapPois = (responses: RegionResponses | null, region: ApiRegion): MapPOI[] => {
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

export default function App() {
  const { alerts, simulationAlerts, latestLiveAlert, unreadCount, connectionState, error: alertsError, markAllRead } = useClimateAlerts();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<OfficerUser>(OPERATIONAL_ROLES[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // App Navigation States
  const [regions, setRegions] = useState<Record<string, ApiRegion>>({});
  const [selectedRegionKey, setSelectedRegionKey] = useState('vizag');
  const [regionResponses, setRegionResponses] = useState<RegionResponses | null>(null);
  const [currentMode, setCurrentMode] = useState<OperationalMode>('threat');
  const [simulationTier, setSimulationTier] = useState<SimulationTier | null>(null);
  const [simulatedIntelligence, setSimulatedIntelligence] = useState<DisasterIntelligenceResponse | null>(null);
  const [regionLoading, setRegionLoading] = useState(true);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const selectedRegion = regions[selectedRegionKey];
  const activeIntelligence = currentMode === 'simulator'
    ? simulatedIntelligence ?? regionResponses?.disasterIntelligence ?? null
    : regionResponses?.disasterIntelligence ?? null;
  const displayedResponses = regionResponses
    ? { ...regionResponses, disasterIntelligence: activeIntelligence }
    : null;
  const selectedCity = selectedRegion ? buildCity(selectedRegionKey, selectedRegion, displayedResponses) : null;
  const availableCities = Object.entries(regions).map(([key, region]) => buildCity(key, region, null));
  const [isHistoricalView, setIsHistoricalView] = useState<boolean>(false);
  const [isNotificationView, setIsNotificationView] = useState<boolean>(false);
  const [isEvacuationModalOpen, setIsEvacuationModalOpen] = useState(false);
  const [toastAlert, setToastAlert] = useState<ClimateAlert | null>(null);

  // Global Layer States for Map
  const [showMangroveLayer, setShowMangroveLayer] = useState<boolean>(true);
  const [showHistoricalLayer, setShowHistoricalLayer] = useState<boolean>(false);

  // Modal States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const runSimulation = (tier: SimulationTier, regionKey = selectedRegionKey, region = selectedRegion) => {
    if (!region) return;
    setSimulatedIntelligence(createSimulatedIntelligence(
      regionKey === selectedRegionKey ? regionResponses?.disasterIntelligence ?? null : null,
      regionKey,
      region,
      tier,
    ));
    setSimulationTier(tier);
  };

  const resetSimulation = () => {
    setSimulatedIntelligence(null);
    setSimulationTier(null);
  };

  useEffect(() => {
    if (!latestLiveAlert) return;
    setToastAlert(latestLiveAlert);
  }, [latestLiveAlert]);

  useEffect(() => {
    if (!toastAlert) return;
    const timeout = window.setTimeout(() => setToastAlert(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [toastAlert]);

  useEffect(() => {
    const controller = new AbortController();
    api.getRegions(controller.signal)
      .then((data) => {
        setRegions(data);
        if (!data[selectedRegionKey]) setSelectedRegionKey(Object.keys(data)[0] ?? '');
        setRegionError(null);
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setRegionError('Could not load regions. Check that the backend is running.');
      })
      .finally(() => setRegionLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    const controller = new AbortController();
    setRegionLoading(true);
    setRegionResponses(null);
    setRegionError(null);
    Promise.allSettled([
      api.getPopulation(selectedRegionKey, controller.signal),
      api.getForecast(selectedRegionKey, controller.signal),
      api.getInfrastructure(selectedRegionKey, controller.signal),
      api.getCurrentConditions(selectedRegionKey, controller.signal),
      api.getDisasterIntelligence(selectedRegionKey, controller.signal),
    ]).then(([population, forecast, infrastructure, currentConditions, disasterIntelligence]) => {
      if (controller.signal.aborted) return;
      setRegionResponses({
        population: population.status === 'fulfilled' ? population.value : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null,
        infrastructure: infrastructure.status === 'fulfilled' ? infrastructure.value : null,
        currentConditions: currentConditions.status === 'fulfilled' ? currentConditions.value : null,
        disasterIntelligence: disasterIntelligence.status === 'fulfilled' ? disasterIntelligence.value : null,
        currentConditionsError: currentConditions.status === 'rejected' ? currentConditions.reason.message : null,
        disasterIntelligenceError: disasterIntelligence.status === 'rejected'
          ? disasterIntelligence.reason instanceof Error
            ? disasterIntelligence.reason.message
            : 'Disaster intelligence could not be loaded.'
          : null,
      });
      const failedSources = [population, forecast, infrastructure, currentConditions, disasterIntelligence].filter(result => result.status === 'rejected').length;
      setRegionError(failedSources ? `${failedSources} data source${failedSources > 1 ? 's' : ''} could not be loaded.` : null);
    }).finally(() => {
      if (!controller.signal.aborted) setRegionLoading(false);
    });
    return () => controller.abort();
  }, [selectedRegion, selectedRegionKey]);

  useEffect(() => {
    if (!isHistoricalView) return;
    const controller = new AbortController();
    setHistoricalLoading(true);
    setHistoricalError(null);
    setHistoricalData(null);
    api.getHistory(selectedRegionKey, controller.signal)
      .then(setHistoricalData)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setHistoricalError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setHistoricalLoading(false);
      });
    return () => controller.abort();
  }, [isHistoricalView, selectedRegionKey]);

  if (regionLoading && !selectedCity) {
    return <div className="min-h-screen grid place-items-center bg-slate-100 p-6 text-sm text-slate-700"><div role="status" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"><LoaderCircle size={18} className="animate-spin text-cyan-800" /><span>Connecting to the CIIVF API and loading regions…</span></div></div>;
  }

  if (!selectedCity || !selectedRegion) {
    return <div className="min-h-screen grid place-items-center p-6 text-center text-sm text-rose-700">{regionError ?? 'No regions were returned by the backend API.'}</div>;
  }

  // If not logged in, render the Login Page matching attached screenshot
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(officer) => {
          setCurrentUser(officer);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-slate-100 text-slate-800">
      {/* Top Navigation Bar with Profile Dropdown & Settings */}
      <Header
        selectedCity={selectedCity}
        availableCities={availableCities}
        onSelectCity={(city) => {
          resetSimulation();
          setSelectedRegionKey(city.id);
          if (currentMode === 'simulator' && regions[city.id]) runSimulation('YELLOW', city.id, regions[city.id]);
        }}
        onOpenNotifications={() => {
          resetSimulation();
          setIsNotificationView(true);
          setIsHistoricalView(false);
          markAllRead();
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistoricalDisasters={() => {
          resetSimulation();
          setIsHistoricalView(true);
          setIsNotificationView(false);
        }}
        unreadAlertsCount={unreadCount}
        currentUser={currentUser}
        onLogout={() => setIsLoggedIn(false)}
      />

      <div className="flex-1 flex flex-row">
        {/* Left Navigation Sidebar with PROJECT FLOW Tabs */}
        <Sidebar
          currentMode={currentMode}
          onSelectMode={(mode) => {
            setCurrentMode(mode);
            if (mode === 'simulator') runSimulation('YELLOW');
            else resetSimulation();
            setIsHistoricalView(false);
            setIsNotificationView(false);
          }}
          isHistoricalView={isHistoricalView}
          onSelectHistoricalView={(isHistory) => {
            if (isHistory) resetSimulation();
            setIsHistoricalView(isHistory);
            if (isHistory) setIsNotificationView(false);
          }}
          isNotificationView={isNotificationView}
          onSelectNotificationView={(isNotif) => {
            if (isNotif) resetSimulation();
            setIsNotificationView(isNotif);
            if (isNotif) {
              setIsHistoricalView(false);
              markAllRead();
            }
          }}
          onOpenAlerts={() => {
            resetSimulation();
            setIsNotificationView(true);
            setIsHistoricalView(false);
            markAllRead();
          }}
          alertsCount={unreadCount}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden max-w-[1600px] w-full mx-auto">
          {regionError && (
            <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {regionError} Some dashboard sections may be incomplete.
            </div>
          )}
          {regionLoading && (
            <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-medium text-cyan-950">
              <LoaderCircle size={15} className="animate-spin" /> Loading live region data and disaster intelligence…
            </div>
          )}
          {!isNotificationView && !isHistoricalView && currentMode === 'simulator' && simulationTier && (
            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs text-cyan-950">
              <span><strong>SIMULATION ACTIVE · {simulationTier}</strong> Risk conditions shown are mock data, not a live warning.</span>
              <button type="button" onClick={resetSimulation} className="font-semibold underline underline-offset-2">Return to live data</button>
            </div>
          )}
          {/* 1. If on Notifications Hub View */}
          {isNotificationView ? (
            <ClimateAlertInbox
              alerts={alerts}
              connectionState={connectionState}
              error={alertsError}
              selectedRegionKey={selectedRegionKey}
              regionName={selectedCity.name}
              onBack={() => setIsNotificationView(false)}
            />
          ) : isHistoricalView ? (
            /* 2. If on Historical Disasters View */
            <HistoricalDisastersView
              history={historicalData}
              isLoading={historicalLoading}
              error={historicalError}
              regionName={selectedCity.name}
              onBackToOverview={() => setIsHistoricalView(false)}
            />
          ) : (
            /* 3. Main Dashboard & Project Flow Modes */
            <>
              {/* Top City Location & Weather Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Location Pin & Coordinates */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border bg-blue-50 border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <span>{selectedCity.name}, {selectedCity.region}, {selectedCity.country}</span>
                    </h1>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {selectedCity.coordinatesFormatted} <span className="text-slate-300">|</span> Population (est.): <span className="font-semibold text-slate-800">{selectedCity.populationFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Weather & 7-Day Average Badges */}
                <div className="flex items-center gap-3 text-xs shrink-0 self-start md:self-center">
                  {/* Current Weather */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200">
                    <CloudRain size={20} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">{currentMode === 'simulator' && simulationTier ? 'Scenario Telemetry' : 'Current Conditions'}</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-sm font-mono text-slate-900">
                          {currentMode === 'simulator' && simulationTier
                            ? activeIntelligence?.current_conditions.wind_speed_kmh == null ? 'Unavailable' : `${activeIntelligence.current_conditions.wind_speed_kmh} km/h`
                            : regionResponses?.currentConditions?.temperature_c == null ? 'Unavailable' : `${regionResponses.currentConditions.temperature_c}°C`}
                        </span>
                        <span className="max-w-48 truncate text-[11px] font-medium text-slate-600" title={currentMode === 'simulator' && simulationTier ? 'Simulated wind speed' : regionResponses?.currentConditions?.condition ?? regionResponses?.currentConditionsError ?? ''}>
                          {currentMode === 'simulator' && simulationTier
                            ? `${activeIntelligence?.current_conditions.pressure_hpa ?? 'Unavailable'} hPa · ${activeIntelligence?.risk_assessment.level ?? 'UNKNOWN'} risk`
                            : regionResponses?.currentConditions?.condition ?? regionResponses?.currentConditionsError ?? 'Waiting for current weather data'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next 7 Days Average */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200">
                    <CloudRain size={20} className="text-cyan-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Next 7 Days (avg.)</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-sm font-mono text-slate-900">{selectedCity.tempRangeAvg}</span>
                        <span className="text-[11px] font-medium text-slate-600">{selectedCity.forecastSummary}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC MODE RENDERING BASED ON PROJECT FLOW (SELECTED IN SIDEBAR) */}

              {/* 1. Complete Integrated Dashboard (Overview) */}
              {currentMode === 'overview' && (
                <div className="space-y-4">
                  <AssessmentCards
                    city={selectedCity}
                    infrastructure={regionResponses?.infrastructure ?? null}
                    isLightMode={true}
                  />

                  {/* Center Layout: Interactive Map + 7-Day Forecast on Left (8 cols) and Global Vulnerability on Right (4 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Center Column: Map & Weather Chart (8 of 12 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      <MapComponent
                        showMangroveLayer={showMangroveLayer}
                        onToggleMangrove={setShowMangroveLayer}
                        showHistoricalLayer={showHistoricalLayer}
                        onToggleHistorical={setShowHistoricalLayer}
                        systemStatusLabel="System: Operational"
                        systemStatusColor="amber"
                        isLightMode={true}
                        pois={buildMapPois(displayedResponses, selectedRegion)}
                        cityLabel={selectedCity.name}
                        bounds={selectedRegion}
                        riskZones={activeIntelligence?.risk_zones ?? []}
                        isLoading={regionLoading}
                        emptyMessage={Object.values(regionResponses?.infrastructure?.source_errors ?? {}).join(' ') || 'The provider returned no facility coordinates for this region.'}
                      />

                      <WeatherHazardChart forecast={regionResponses?.forecast?.forecast ?? []} isLightMode={true} />
                    </div>

                    {/* Right Column: API source status */}
                    <div className="lg:col-span-4">
                      <RightColumnCards
                        city={selectedCity}
                        alerts={alerts}
                        connectionState={connectionState}
                        onOpenAlerts={() => {
                          setIsNotificationView(true);
                          markAllRead();
                        }}
                        isLightMode={true}
                      />
                      {/* Bottom Row: Population Exposure, Shelters, and Evacuation Routes */}
                  <BottomRowCards
                    infrastructure={regionResponses?.infrastructure ?? null}
                    isLightMode={true}
                  />
                    </div>
                  </div>

                  
                </div>
              )}

              {currentMode === 'baseline' && (
                <BaselineModeView
                  city={selectedCity}
                  showMangroveLayer={showMangroveLayer}
                  onToggleMangrove={setShowMangroveLayer}
                  showHistoricalLayer={showHistoricalLayer}
                  onToggleHistorical={setShowHistoricalLayer}
                  isLightMode={true}
                />
              )}

              {currentMode === 'threat' && (
                <ThreatDetectionModeView
                  city={selectedCity}
                  bounds={selectedRegion}
                  pois={buildMapPois(displayedResponses, selectedRegion)}
                  disasterIntelligence={activeIntelligence}
                  isLoading={regionLoading}
                  error={regionResponses?.disasterIntelligenceError ?? null}
                  showMangroveLayer={showMangroveLayer}
                  onToggleMangrove={setShowMangroveLayer}
                  showHistoricalLayer={showHistoricalLayer}
                  onToggleHistorical={setShowHistoricalLayer}
                  isLightMode={true}
                />
              )}

              {currentMode === 'tasks' && (
                <TaskEvacuationModeView
                  city={selectedCity}
                  bounds={selectedRegion}
                  pois={buildMapPois(displayedResponses, selectedRegion)}
                  disasterIntelligence={activeIntelligence}
                  isLoading={regionLoading}
                  error={regionResponses?.disasterIntelligenceError ?? null}
                  showMangroveLayer={showMangroveLayer}
                  onToggleMangrove={setShowMangroveLayer}
                  showHistoricalLayer={showHistoricalLayer}
                  onToggleHistorical={setShowHistoricalLayer}
                  onOpenEvacuationModal={() => setIsEvacuationModalOpen(true)}
                  isLightMode={true}
                />
              )}

              {currentMode === 'landfall' && (
                <LandfallRescueModeView
                  city={selectedCity}
                  isLightMode={true}
                />
              )}

              {currentMode === 'recovery' && (
                <InsuranceRecoveryModeView
                  city={selectedCity}
                  insuranceSummary={activeIntelligence?.insurance_summary ?? undefined}
                  riskZones={activeIntelligence?.risk_zones ?? []}
                  isLightMode={true}
                />
              )}

              {currentMode === 'simulator' && (
                <SimulatorModeView
                  regionName={selectedCity.name}
                  bounds={selectedRegion}
                  pois={buildMapPois(displayedResponses, selectedRegion)}
                  intelligence={activeIntelligence}
                  tier={simulationTier}
                  onSimulate={runSimulation}
                  onReset={resetSimulation}
                  connectionState={connectionState}
                  simulationAlerts={simulationAlerts}
                  onBroadcast={async (tier, ward, phone, token) => {
                    const result = await api.broadcastSimulatorAlert(selectedRegionKey, tier, ward, phone, token);
                    setToastAlert(result.alert);
                    return result;
                  }}
                  isLoading={regionLoading}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Action Modals */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <EvacuationModal
        isOpen={isEvacuationModalOpen}
        onClose={() => setIsEvacuationModalOpen(false)}
        isLightMode={true}
      />

      {toastAlert && <AlertToast alert={toastAlert} onClose={() => setToastAlert(null)} />}

    </div>
  );
}

function AlertToast({ alert, onClose }: { alert: ClimateAlert; onClose: () => void }) {
  const tone = alert.simulation_tier === 'RED' || alert.severity === 'critical'
    ? 'border-rose-300 bg-rose-50 text-rose-950'
    : alert.simulation_tier === 'ORANGE' || alert.severity === 'high'
      ? 'border-orange-300 bg-orange-50 text-orange-950'
      : alert.simulation_tier === 'YELLOW' || alert.severity === 'moderate'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-emerald-300 bg-emerald-50 text-emerald-950';
  const zoneLabel = alert.simulation_tier ? `${alert.simulation_tier} ZONE` : alert.severity.toUpperCase();

  return (
    <aside role="alert" aria-live="assertive" className={`fixed right-4 top-4 z-[80] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border shadow-xl ${tone}`}>
      <div className="flex items-start gap-3 p-4">
        <BellRing size={17} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <strong className="text-[10px] font-black uppercase tracking-wide">{zoneLabel}</strong>
            {alert.is_simulation && <span className="rounded border border-current/30 px-1.5 py-0.5 text-[9px] font-bold">TEST</span>}
          </div>
          <p className="mt-1 text-sm font-bold leading-snug">{alert.title}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed opacity-85">{alert.description}</p>
          <p className="mt-2 text-[10px] font-semibold opacity-75">{alert.location.name} · closes automatically</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss alert toast" className="rounded p-1 opacity-70 hover:bg-black/5 hover:opacity-100"><X size={16} /></button>
      </div>
    </aside>
  );
}
