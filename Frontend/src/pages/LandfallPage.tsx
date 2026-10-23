import { useOutletContext } from 'react-router-dom';
import { LandfallRescueModeView } from '@/components/dashboard/modes/LandfallRescueModeView';
import type { DashboardOutletData } from '../types/dashboard';

export default function LandfallPage() {
  const { selectedCity } = useOutletContext<DashboardOutletData>();
  return selectedCity ? <LandfallRescueModeView city={selectedCity} isLightMode /> : null;
}
