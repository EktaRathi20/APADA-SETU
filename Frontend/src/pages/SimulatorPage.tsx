import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { SimulatorModeView } from '@/components/dashboard/modes/SimulatorModeView';
import type { DashboardOutletData } from '../types/dashboard';
import { buildMapPois } from '../utils/transformers';

export default function SimulatorPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const { selectedCity, selectedRegion, displayedResponses, activeIntelligence } = dashboard;
  if (!selectedCity || !selectedRegion) return null;

  return (
    <SimulatorModeView
      regionName={selectedCity.name}
      bounds={selectedRegion}
      pois={buildMapPois(displayedResponses, selectedRegion)}
      intelligence={activeIntelligence}
      tier={dashboard.simulationTier}
      onSimulate={dashboard.runSimulation}
      onReset={dashboard.resetSimulation}
      connectionState={dashboard.connectionState}
      simulationAlerts={dashboard.simulationAlerts}
      onBroadcast={async (tier, ward, phone, token) => {
        const result = await api.broadcastSimulatorAlert(dashboard.selectedRegionKey, tier, ward, phone, token);
        dashboard.setToastAlert(result.alert);
        return result;
      }}
      isLoading={dashboard.regionLoading}
    />
  );
}
