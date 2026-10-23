import { httpClient } from './httpClient';
import type {
  ApiRegion,
  CurrentConditionsResponse,
  DispatchChatRequest,
  DispatchChatResponse,
  DisasterIntelligenceResponse,
  ForecastResponse,
  HistoricalResponse,
  InfrastructureResponse,
  PopulationResponse,
  SimulatorBroadcastResponse,
  WhatsAppConfigurationResponse,
} from '../types/api';
import type { ClimateAlert } from '../types/alerts';

export const api = {
  getRegions: (signal?: AbortSignal) => httpClient.get<Record<string, ApiRegion>>('/region', { signal }),
  getPopulation: (region: string, signal?: AbortSignal) =>
    httpClient.get<PopulationResponse>(`/population?region=${encodeURIComponent(region)}`, { signal }),
  getForecast: (region: string, signal?: AbortSignal) =>
    httpClient.get<ForecastResponse>(`/forecast?region=${encodeURIComponent(region)}`, { signal }),
  getInfrastructure: (region: string, signal?: AbortSignal) =>
    httpClient.get<InfrastructureResponse>(`/shelter?region=${encodeURIComponent(region)}`, { signal }),
  getCurrentConditions: (region: string, signal?: AbortSignal) =>
    httpClient.get<CurrentConditionsResponse>(`/current-conditions?region=${encodeURIComponent(region)}`, { signal }),
  getHistory: (
    region: string,
    params: { page: number; pageSize: number; search: string; sortBy: 'newest' | 'oldest' | 'wind' | 'distance' },
    signal?: AbortSignal,
  ) =>
    httpClient.get<HistoricalResponse>(
      `/history?region=${encodeURIComponent(region)}&page=${params.page}&page_size=${params.pageSize}`
      + `&search=${encodeURIComponent(params.search)}&sort_by=${params.sortBy}`,
      { signal },
    ),
  getWhatsAppConfiguration: (signal?: AbortSignal) =>
    httpClient.get<WhatsAppConfigurationResponse>('/whatsapp/configuration', { signal }),
  getClimateAlerts: (signal?: AbortSignal) =>
    httpClient.get<ClimateAlert[]>('/alerts', { params: { limit: 500 }, signal }),
  sendDispatchChat: (query: string, region: string) =>
    httpClient.post<DispatchChatResponse, DispatchChatRequest>('/dispatch-chat', { query, region }),
  getDisasterIntelligence: (region: string, signal?: AbortSignal) =>
    httpClient.get<DisasterIntelligenceResponse>(`/disaster-intelligence/${encodeURIComponent(region)}`, { signal }),
  broadcastSimulatorAlert: (regionKey: string, tier: 'YELLOW' | 'ORANGE' | 'RED', ward: string, phone: string | null, token: string) =>
    httpClient.post<SimulatorBroadcastResponse>('/simulator/alerts', { region_key: regionKey, tier, ward, phone }, {
      headers: { 'X-Simulator-Token': token },
    }),
  startWhatsAppVerification: (phone: string) =>
    httpClient.post<{ status: string }>('/whatsapp/verification/start', { phone }),
  checkWhatsAppVerification: (phone: string, code: string, action: 'subscribe' | 'unsubscribe') =>
    httpClient.post<{ status: string; action: string; welcome_message: 'queued' | 'already_subscribed' | 'not_configured' | 'not_applicable' }>('/whatsapp/verification/check', { phone, code, action }),
};
