import { useOutletContext } from 'react-router-dom';
import { ThreatDetectionModeView } from '@/components/dashboard/modes/ThreatDetectionModeView';
import type { DashboardOutletData } from '../types/dashboard';
import { buildMapPois } from '../utils/transformers';

export default function ThreatPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const { selectedCity, selectedRegion, displayedResponses, activeIntelligence, regionResponses } = dashboard;
  if (!selectedCity || !selectedRegion) return null;

  return (
    <ThreatDetectionModeView
      city={selectedCity}
      bounds={selectedRegion}
      pois={buildMapPois(displayedResponses, selectedRegion)}
      disasterIntelligence={activeIntelligence}
      isLoading={dashboard.regionLoading}
      error={regionResponses?.disasterIntelligenceError ?? null}
      showMangroveLayer={dashboard.showMangroveLayer}
      onToggleMangrove={dashboard.setShowMangroveLayer}
      showHistoricalLayer={dashboard.showHistoricalLayer}
      onToggleHistorical={dashboard.setShowHistoricalLayer}
      isLightMode
    />
  );
}
