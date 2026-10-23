import type { Dispatch, SetStateAction } from 'react';
import type { ClimateAlert } from './alerts';
import type {
  ApiRegion,
  DisasterIntelligenceResponse,
  HistoricalResponse,
  RegionResponses,
} from './api';
import type { CityLocation } from './domain';
import type { SimulationTier } from '../features/simulator/simulator';

export interface DashboardOutletData {
  alerts: ClimateAlert[];
  simulationAlerts: ClimateAlert[];
  unreadCount: number;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  alertsError: string | null;
  alertsLoading: boolean;
  retryAlerts: () => void;
  markAllRead: () => void;
  regions: Record<string, ApiRegion>;
  selectedRegionKey: string;
  setSelectedRegionKey: Dispatch<SetStateAction<string>>;
  selectedRegion: ApiRegion | undefined;
  selectedCity: CityLocation | null;
  availableCities: CityLocation[];
  regionResponses: RegionResponses | null;
  displayedResponses: RegionResponses | null;
  activeIntelligence: DisasterIntelligenceResponse | null;
  regionLoading: boolean;
  regionError: string | null;
  regionDataError: string | null;
  retryRegions: () => void;
  retryRegionData: () => void;
  historicalData: HistoricalResponse | null;
  historicalLoading: boolean;
  historicalError: string | null;
  retryHistoricalData: () => void;
  simulationTier: SimulationTier | null;
  runSimulation: (tier: SimulationTier, regionKey?: string, region?: ApiRegion) => void;
  resetSimulation: () => void;
  showMangroveLayer: boolean;
  setShowMangroveLayer: Dispatch<SetStateAction<boolean>>;
  showHistoricalLayer: boolean;
  setShowHistoricalLayer: Dispatch<SetStateAction<boolean>>;
  isEvacuationModalOpen: boolean;
  setIsEvacuationModalOpen: Dispatch<SetStateAction<boolean>>;
  toastAlert: ClimateAlert | null;
  setToastAlert: Dispatch<SetStateAction<ClimateAlert | null>>;
}
