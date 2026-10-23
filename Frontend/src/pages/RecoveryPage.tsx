import { useOutletContext } from 'react-router-dom';
import { InsuranceRecoveryModeView } from '@/components/dashboard/modes/InsuranceRecoveryModeView';
import type { DashboardOutletData } from '../types/dashboard';

export default function RecoveryPage() {
  const { selectedCity, activeIntelligence } = useOutletContext<DashboardOutletData>();
  if (!selectedCity) return null;

  return (
    <InsuranceRecoveryModeView
      insuranceSummary={activeIntelligence?.insurance_summary}
      isLightMode
    />
  );
}
