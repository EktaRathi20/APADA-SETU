import { useOutletContext } from 'react-router-dom';
import { TaskEvacuationModeView } from '@/components/dashboard/modes/TaskEvacuationModeView';
import type { DashboardOutletData } from '../types/dashboard';
import { buildMapPois } from '../utils/transformers';

export default function TasksPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const { selectedCity, selectedRegion, displayedResponses, activeIntelligence, regionResponses } = dashboard;
  if (!selectedCity || !selectedRegion) return null;

  return (
    <TaskEvacuationModeView
      city={selectedCity}
      bounds={selectedRegion}
      pois={buildMapPois(displayedResponses, selectedRegion)}
      disasterIntelligence={activeIntelligence}
      isLoading={dashboard.regionLoading}
      error={regionResponses?.disasterIntelligenceError ?? null}
      onOpenEvacuationModal={() => dashboard.setIsEvacuationModalOpen(true)}
      isLightMode
    />
  );
}
