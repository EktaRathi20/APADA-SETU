import { io } from 'socket.io-client';

export interface ClimateAlert {
  id: string;
  hazard_type: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  description: string;
  location: {
    name: string;
    region_key: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  source: string;
  observed_at: string;
  received_at: string;
  measurements: Record<string, unknown>;
  is_simulation?: boolean;
  simulation_tier?: 'YELLOW' | 'ORANGE' | 'RED';
}

export type AlertConnectionState = 'connecting' | 'connected' | 'disconnected';

export async function getClimateAlerts(signal: AbortSignal): Promise<ClimateAlert[]> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/alerts?limit=500`, { signal });
  if (!response.ok) throw new Error(`Could not load alerts (${response.status})`);
  return response.json() as Promise<ClimateAlert[]>;
}

export function createClimateAlertSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
  });
}