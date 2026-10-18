import { useOutletContext } from 'react-router-dom';
import { BaselineModeView } from '@/components/dashboard/modes/BaselineModeView';
import type { DashboardOutletData } from '../types/dashboard';

export default function BaselinePage() {
  const dashboard = useOutletContext<DashboardOutletData>();
  if (!dashboard.selectedCity) return null;

  return (
    <BaselineModeView
      city={dashboard.selectedCity}
      showMangroveLayer={dashboard.showMangroveLayer}
      onToggleMangrove={dashboard.setShowMangroveLayer}
    />
  );
}
