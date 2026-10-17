import { useEffect, useState } from 'react';
import { AlertConnectionState, ClimateAlert, createClimateAlertSocket, getClimateAlerts } from './climateAlerts';

const newestFirst = (alerts: ClimateAlert[]) =>
  alerts.sort((left, right) => Date.parse(right.received_at) - Date.parse(left.received_at));

export function useClimateAlerts() {
  const [alerts, setAlerts] = useState<ClimateAlert[]>([]);
  const [simulationAlerts, setSimulationAlerts] = useState<ClimateAlert[]>([]);
  const [latestLiveAlert, setLatestLiveAlert] = useState<ClimateAlert | null>(null);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() => new Set());
  const [connectionState, setConnectionState] = useState<AlertConnectionState>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const socket = createClimateAlertSocket();

    getClimateAlerts(controller.signal)
      .then((initialAlerts) => {
        setAlerts((current) => {
          const byId = new Map(current.map((alert) => [alert.id, alert]));
          initialAlerts.filter((alert) => !alert.is_simulation).forEach((alert) => {
            if (!byId.has(alert.id)) byId.set(alert.id, alert);
          });
          return newestFirst([...byId.values()]).slice(0, 500);
        });
        setSimulationAlerts((current) => {
          const byId = new Map(current.map((alert) => [alert.id, alert]));
          initialAlerts.filter((alert) => alert.is_simulation).forEach((alert) => byId.set(alert.id, alert));
          return newestFirst([...byId.values()]).slice(0, 50);
        });
        setError(null);
      })
      .catch((loadError: Error) => {
        if (loadError.name !== 'AbortError') setError(loadError.message);
      });

    socket.on('connect', () => setConnectionState('connected'));
    socket.on('disconnect', () => setConnectionState('disconnected'));
    socket.on('connect_error', () => setConnectionState('disconnected'));
    socket.on('climate_alert', (alert: ClimateAlert) => {
      if (alert.is_simulation) {
        setSimulationAlerts((current) => newestFirst([alert, ...current.filter((item) => item.id !== alert.id)]).slice(0, 50));
        return;
      }
      setAlerts((current) => newestFirst([alert, ...current.filter((item) => item.id !== alert.id)]).slice(0, 500));
      setUnreadIds((current) => new Set(current).add(alert.id));
      setLatestLiveAlert(alert);
    });
    socket.connect();

    return () => {
      controller.abort();
      socket.disconnect();
    };
  }, []);

  return {
    alerts,
    simulationAlerts,
    latestLiveAlert,
    unreadCount: unreadIds.size,
    connectionState,
    error,
    markAllRead: () => setUnreadIds(new Set()),
  };
}