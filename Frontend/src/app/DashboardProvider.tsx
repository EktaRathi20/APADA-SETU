import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { ApiRegion, DisasterIntelligenceResponse, RegionResponses } from '../types/api';
import { ClimateAlert } from '../services/climateAlerts';
import { useClimateAlerts } from '../hooks/useClimateAlerts';
import { createSimulatedIntelligence, SimulationTier } from '../features/simulator/simulator';
import { buildCity } from '../utils/transformers';
import type { DashboardOutletData } from '../types/dashboard';
import { isAbortError } from '../services/apiError';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'The request failed unexpectedly.';

const FALLBACK_REGIONS: Record<string, ApiRegion> = {
  vizag: {
    min_lon: 83.15,
    min_lat: 17.65,
    max_lon: 83.35,
    max_lat: 17.75,
    name: 'Visakhapatnam',
  },
};

const routeModes = {
  '/overview': 'overview',
  '/baseline': 'baseline',
  '/threat': 'threat',
  '/tasks': 'tasks',
  '/landfall': 'landfall',
  '/recovery': 'recovery',
  '/simulator': 'simulator',
} as const;

export default function DashboardProvider() {
  const location = useLocation();
  const mode = routeModes[location.pathname as keyof typeof routeModes] ?? 'threat';
  const {
    alerts,
    simulationAlerts,
    latestLiveAlert,
    unreadCount,
    connectionState,
    error: alertsError,
    isLoading: alertsLoading,
    retry: retryAlerts,
    markAllRead,
  } = useClimateAlerts();

  const [regions, setRegions] = useState<Record<string, ApiRegion>>({});
  const [selectedRegionKey, setSelectedRegionKey] = useState('vizag');
  const [regionResponses, setRegionResponses] = useState<RegionResponses | null>(null);
  const [simulationTier, setSimulationTier] = useState<SimulationTier | null>(null);
  const [simulatedIntelligence, setSimulatedIntelligence] = useState<DisasterIntelligenceResponse | null>(null);
  const [regionLoading, setRegionLoading] = useState(true);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [regionDataError, setRegionDataError] = useState<string | null>(null);
  const [regionsRetry, setRegionsRetry] = useState(0);
  const [regionDataRetry, setRegionDataRetry] = useState(0);
  const [toastAlert, setToastAlert] = useState<ClimateAlert | null>(null);
  const [showMangroveLayer, setShowMangroveLayer] = useState(true);
  const [showHistoricalLayer, setShowHistoricalLayer] = useState(false);
  const [isEvacuationModalOpen, setIsEvacuationModalOpen] = useState(false);

  const selectedRegion = regions[selectedRegionKey];
  const activeIntelligence = mode === 'simulator'
    ? simulatedIntelligence ?? regionResponses?.disasterIntelligence ?? null
    : regionResponses?.disasterIntelligence ?? null;
  const displayedResponses = regionResponses
    ? { ...regionResponses, disasterIntelligence: activeIntelligence }
    : null;
  const selectedCity = selectedRegion ? buildCity(selectedRegionKey, selectedRegion, displayedResponses) : null;
  const availableCities = Object.entries(regions).map(([key, region]) => buildCity(key, region, null));

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
    setRegionLoading(true);
    setRegionError(null);
    api.getRegions(controller.signal)
      .then((data) => {
        if (Object.keys(data).length === 0) {
          setRegionError('Region information is temporarily unavailable.');
          setRegions(current => Object.keys(current).length ? current : FALLBACK_REGIONS);
          return;
        }
        setRegions(data);
        if (!data[selectedRegionKey]) setSelectedRegionKey(Object.keys(data)[0] ?? '');
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setRegionError('Region information is temporarily unavailable.');
          setRegions(current => Object.keys(current).length ? current : FALLBACK_REGIONS);
        }
      })
      .finally(() => setRegionLoading(false));
    return () => controller.abort();
  }, [regionsRetry]);

  useEffect(() => {
    if (!selectedRegion) return;
    const controller = new AbortController();
    setRegionLoading(true);
    setRegionResponses(null);
    setRegionDataError(null);
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
        currentConditionsError: currentConditions.status === 'rejected' ? errorMessage(currentConditions.reason) : null,
        disasterIntelligenceError: disasterIntelligence.status === 'rejected'
          ? errorMessage(disasterIntelligence.reason)
          : null,
      });
      const hasFailedSources = [population, forecast, infrastructure, currentConditions, disasterIntelligence]
        .some(result => result.status === 'rejected');
      setRegionDataError(hasFailedSources ? 'Some dashboard information is temporarily unavailable.' : null);
    }).finally(() => {
      if (!controller.signal.aborted) setRegionLoading(false);
    });
    return () => controller.abort();
  }, [selectedRegion, selectedRegionKey, regionDataRetry]);

  const retryRegions = () => setRegionsRetry(value => value + 1);
  const retryRegionData = () => setRegionDataRetry(value => value + 1);

  const outletData: DashboardOutletData = {
    alerts,
    simulationAlerts,
    unreadCount,
    connectionState,
    alertsError,
    alertsLoading,
    retryAlerts,
    markAllRead,
    regions,
    selectedRegionKey,
    setSelectedRegionKey,
    selectedRegion,
    selectedCity,
    availableCities,
    regionResponses,
    displayedResponses,
    activeIntelligence,
    regionLoading,
    regionError,
    regionDataError,
    retryRegions,
    retryRegionData,
    simulationTier,
    runSimulation,
    resetSimulation,
    showMangroveLayer,
    setShowMangroveLayer,
    showHistoricalLayer,
    setShowHistoricalLayer,
    isEvacuationModalOpen,
    setIsEvacuationModalOpen,
    toastAlert,
    setToastAlert,
  };

  return <Outlet context={outletData} />;
}
