import { useNavigate, useOutletContext } from 'react-router-dom';
import { AssessmentCards } from '@/components/dashboard/AssessmentCards';
import { BottomRowCards } from '@/components/dashboard/BottomRowCards';
import { MapComponent } from '@/components/dashboard/MapComponent';
import { RightColumnCards } from '@/components/dashboard/RightColumnCards';
import { WeatherHazardChart } from '@/components/dashboard/WeatherHazardChart';
import type { DashboardOutletData } from '../types/dashboard';
import { buildMapPois } from '../utils/transformers';

export default function OverviewPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const navigate = useNavigate();
  const { selectedCity, selectedRegion, regionResponses, activeIntelligence, displayedResponses } = dashboard;
  if (!selectedCity || !selectedRegion) return null;

  return (
    <div className="space-y-4">
      <AssessmentCards city={selectedCity} infrastructure={regionResponses?.infrastructure ?? null} isLightMode />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <MapComponent
            showMangroveLayer={dashboard.showMangroveLayer}
            onToggleMangrove={dashboard.setShowMangroveLayer}
            showHistoricalLayer={dashboard.showHistoricalLayer}
            onToggleHistorical={dashboard.setShowHistoricalLayer}
            systemStatusLabel="System: Operational"
            systemStatusColor="amber"
            isLightMode
            pois={buildMapPois(displayedResponses, selectedRegion)}
            cityLabel={selectedCity.name}
            bounds={selectedRegion}
            riskZones={activeIntelligence?.risk_zones ?? []}
            isLoading={dashboard.regionLoading}
            emptyMessage={Object.values(regionResponses?.infrastructure?.source_errors ?? {}).join(' ') || 'The provider returned no facility coordinates for this region.'}
          />
          <WeatherHazardChart forecast={regionResponses?.forecast?.forecast ?? []} isLightMode />
        </div>
        <div className="lg:col-span-4">
          <RightColumnCards
            city={selectedCity}
            alerts={dashboard.alerts}
            connectionState={dashboard.connectionState}
            onOpenAlerts={() => {
              dashboard.markAllRead();
              navigate('/alerts');
            }}
            isLightMode
          />
          <BottomRowCards infrastructure={regionResponses?.infrastructure ?? null} isLightMode />
        </div>
      </div>
    </div>
  );
}
