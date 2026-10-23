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
