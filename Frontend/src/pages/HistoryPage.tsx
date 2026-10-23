import { useNavigate, useOutletContext } from 'react-router-dom';
import { HistoricalDisastersView } from '@/components/dashboard/modes/HistoricalDisastersView';
import type { DashboardOutletData } from '../types/dashboard';

export default function HistoryPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const navigate = useNavigate();

  return (
    <HistoricalDisastersView
      history={dashboard.historicalData}
      isLoading={dashboard.historicalLoading}
      error={dashboard.historicalError}
      onRetry={dashboard.retryHistoricalData}
      regionName={dashboard.selectedCity?.name ?? ''}
      onBackToOverview={() => navigate('/overview')}
    />
  );
}
