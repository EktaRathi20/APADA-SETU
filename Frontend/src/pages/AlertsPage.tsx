import { useNavigate, useOutletContext } from 'react-router-dom';
import { Notification } from '@/components/dashboard/modes/NotificationModeView';
import type { DashboardOutletData } from '../types/dashboard';

export default function AlertsPage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  const navigate = useNavigate();

  return (
    <Notification
      alerts={dashboard.alerts}
      connectionState={dashboard.connectionState}
      error={dashboard.alertsError}
      isLoading={dashboard.alertsLoading}
      onRetry={dashboard.retryAlerts}
      selectedRegionKey={dashboard.selectedRegionKey}
      regionName={dashboard.selectedCity?.name ?? ''}
      onBack={() => navigate('/overview')}
    />
  );
}
