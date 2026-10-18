import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { ApiRegion, DisasterIntelligenceResponse, HistoricalResponse, RegionResponses } from '../types/api';
import { ClimateAlert } from '../services/climateAlerts';
import { useClimateAlerts } from '../hooks/useClimateAlerts';
import { createSimulatedIntelligence, SimulationTier } from '../features/simulator/simulator';
import { buildCity } from '../utils/transformers';
import type { DashboardOutletData } from '../types/dashboard';

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
    markAllRead,
  } = useClimateAlerts();

  const [regions, setRegions] = useState<Record<string, ApiRegion>>({});
  const [selectedRegionKey, setSelectedRegionKey] = useState('vizag');
  const [regionResponses, setRegionResponses] = useState<RegionResponses | null>(null);
  const [simulationTier, setSimulationTier] = useState<SimulationTier | null>(null);
  const [simulatedIntelligence, setSimulatedIntelligence] = useState<DisasterIntelligenceResponse | null>(null);
  const [regionLoading, setRegionLoading] = useState(true);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
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
      const failedSources = [population, forecast, infrastructure, currentConditions, disasterIntelligence]
        .filter(result => result.status === 'rejected').length;
      setRegionError(failedSources ? `${failedSources} data source${failedSources > 1 ? 's' : ''} could not be loaded.` : null);
    }).finally(() => {
      if (!controller.signal.aborted) setRegionLoading(false);
    });
    return () => controller.abort();
  }, [selectedRegion, selectedRegionKey]);

  useEffect(() => {
    if (location.pathname !== '/history') return;
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
  }, [location.pathname, selectedRegionKey]);

  const outletData: DashboardOutletData = {
    alerts,
    simulationAlerts,
    unreadCount,
    connectionState,
    alertsError,
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
    historicalData,
    historicalLoading,
    historicalError,
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
