import React, { useEffect, useState } from 'react';
import { Activity, Banknote, BellRing, CheckCircle2, Clock, LoaderCircle, RotateCcw, ShieldAlert, Wind, Wifi, WifiOff, X } from 'lucide-react';
import { ApiRegion, api, DisasterIntelligenceResponse, SimulatorBroadcastResponse, WhatsAppConfigurationResponse } from '../../api';
import { AlertConnectionState, ClimateAlert } from '../../climateAlerts';
import { MapPOI } from '../../types';
import { SimulationTier } from '../../simulator';
import { MapComponent } from '../MapComponent';

const RED_ZONE_WINDOW_MS = 48 * 60 * 60 * 1000;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

interface SimulatorModeViewProps {
  regionName: string;
  bounds: ApiRegion;
  pois: MapPOI[];
  intelligence: DisasterIntelligenceResponse | null;
  tier: SimulationTier | null;
  onSimulate: (tier: SimulationTier) => void;
  onReset: () => void;
  connectionState: AlertConnectionState;
  simulationAlerts: ClimateAlert[];
  onBroadcast: (tier: SimulationTier, ward: string, phone: string | null, token: string) => Promise<SimulatorBroadcastResponse>;
  isLoading: boolean;
}

const choices: Array<{ tier: SimulationTier; title: string; color: string; activeColor: string; note: string }> = [
  { tier: 'YELLOW', title: 'Simulate Yellow Zone', color: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100', activeColor: 'ring-2 ring-amber-500', note: 'Preparedness and monitoring' },
  { tier: 'ORANGE', title: 'Simulate Orange Zone', color: 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100', activeColor: 'ring-2 ring-orange-500', note: 'Elevated response readiness' },
  { tier: 'RED', title: 'Simulate Red Zone', color: 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100', activeColor: 'ring-2 ring-rose-500', note: 'Immediate response scenario' },
];

export const SimulatorModeView: React.FC<SimulatorModeViewProps> = ({
  regionName,
  bounds,
  pois,
  intelligence,
  tier,
  onSimulate,
  onReset,
  connectionState,
  simulationAlerts,
  onBroadcast,
  isLoading,
}) => {
  const conditions = intelligence?.current_conditions;
  const insurance = intelligence?.insurance_summary;
  const budget = intelligence?.preparedness_budget;
  const locations = [...new Set((intelligence?.ai_analysis.recommended_tasks ?? []).map(task => task.location).filter(Boolean))];
  
  const [selectedWard, setSelectedWard] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(true);
  const [whatsappConfiguration, setWhatsappConfiguration] = useState<WhatsAppConfigurationResponse | null>(null);
  const [configurationError, setConfigurationError] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<SimulatorBroadcastResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [redZoneDeadline, setRedZoneDeadline] = useState<number | null>(null);
  
  const whatsappPreview = broadcastResult?.whatsapp_preview ?? (
    tier
      ? `CIIVF SIMULATION EXERCISE, not a live or official warning. Zone: ${tier}. Area: ${selectedWard || regionName}, ${regionName}. Simulated conditions: wind ${conditions?.wind_speed_kmh ?? 'unavailable'} km/h, pressure ${conditions?.pressure_hpa ?? 'unavailable'} hPa, storm surge ${conditions?.storm_surge_meters?.toFixed(1) ?? 'unavailable'} m. This message is for testing only.`
      : 'Select a simulation zone to preview its WhatsApp message.'
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setRedZoneDeadline(tier === 'RED' ? Date.now() + RED_ZONE_WINDOW_MS : null);
  }, [tier]);

  useEffect(() => {
    const controller = new AbortController();
    api.getWhatsAppConfiguration(controller.signal)
      .then(setWhatsappConfiguration)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setConfigurationError(error.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setSelectedWard(locations[0] ?? `${regionName} response area`);
    setBroadcastResult(null);
    setBroadcastError(null);
    if (tier) setIsAlertOpen(true);
  }, [tier, regionName]);

  const latestScenarioAlert = simulationAlerts.find(alert => alert.simulation_tier === tier);

  const handleBroadcast = async () => {
    if (!tier || !selectedWard) return;
    
    // Fetch the token directly from Vite environment variables
    const token = import.meta.env.VITE_SIMULATOR_BROADCAST_TOKEN;
    
    if (!token) {
      setBroadcastError('Simulator access token is missing in the environment configuration (VITE_SIMULATOR_BROADCAST_TOKEN).');
      return;
    }
    
    const recipient = whatsappNumber.trim();
    if (recipient && !PHONE_PATTERN.test(recipient)) {
      setBroadcastError('Enter the recipient WhatsApp number in international format, for example +14155552671.');
      return;
    }
    
    setIsBroadcasting(true);
    setBroadcastError(null);
    
    try {
      const result = await onBroadcast(tier, selectedWard, recipient || null, token);
      setBroadcastResult(result);
    } catch (error) {
      setBroadcastError(error instanceof Error ? error.message : 'Could not broadcast the simulator alert.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-cyan-800"><Activity size={14} /> Scenario sandbox</div>
          <h1 className="mt-1 text-lg font-bold text-slate-900">Zone Event Simulator · {regionName}</h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">Preview how risk overlays, threat indicators, response tasks, and insurance thresholds appear during an event. Simulator values never create alerts or alter backend data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tier === 'RED' && redZoneDeadline !== null && (
            <div
              role="timer"
              aria-label={`48-hour red-zone countdown: ${formatCountdown(Math.max(0, redZoneDeadline - currentTime))} remaining`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900"
            >
              <Clock size={14} /> T-{formatCountdown(Math.max(0, redZoneDeadline - currentTime))}
            </div>
          )}
          <button onClick={() => setIsAlertOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"><BellRing size={14} /> Alert preview</button>
          {tier && <button onClick={onReset} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={14} /> Return to live data</button>}
        </div>
      </section>

      <div role="note" className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950">
        {tier ? `SIMULATION ACTIVE · ${tier} zone · demonstration data only` : 'Choose a risk tier to preview the corresponding dashboard state. Live data remains unchanged.'}
      </div>
      {isLoading && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-medium text-cyan-950"><LoaderCircle size={14} className="animate-spin" />Loading live region facilities and supporting data. The selected scenario remains simulated.</div>}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Risk scenario controls">
        {choices.map(choice => (
          <button
            key={choice.tier}
            type="button"
            onClick={() => onSimulate(choice.tier)}
            aria-pressed={tier === choice.tier}
            className={`flex min-h-20 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${choice.color} ${tier === choice.tier ? choice.activeColor : ''}`}
          >
            <span>
              <span className="block text-sm font-bold">{choice.title}</span>
              <span className="mt-1 block text-[11px] opacity-80">{choice.note}</span>
            </span>
            <ShieldAlert size={19} className="shrink-0" />
          </button>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Simulated wind" value={conditions?.wind_speed_kmh == null ? 'Live data' : `${conditions.wind_speed_kmh} km/h`} icon={<Wind size={15} />} />
        <Metric label="Pressure" value={conditions?.pressure_hpa == null ? 'Live data' : `${conditions.pressure_hpa} hPa`} />
        <Metric label="Storm surge" value={conditions?.storm_surge_meters == null ? 'Live data' : `${conditions.storm_surge_meters.toFixed(2)} m`} />
        <Metric label="Insurance threshold" value={insurance?.trigger_met == null ? 'Not evaluated' : insurance.trigger_met ? 'Reached in scenario' : 'Not reached'} />
      </div>

      {budget && (
        <section className="overflow-hidden rounded-xl border border-cyan-200 bg-white shadow-sm" aria-label="Simulated preparedness budget">
          <div className="flex flex-col gap-3 border-b border-cyan-100 bg-cyan-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Banknote size={16} className="text-cyan-800" /> Pre-disaster readiness budget <span className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-900">Mock estimate</span></h2>
              <p className="mt-1 text-[11px] text-slate-600">Illustrative {budget.planning_window_hours}-hour response-preparation window · not an authorized government allocation.</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase text-slate-500">Scenario subtotal</p>
              <p className="text-xl font-black text-slate-900">{formatINR(budget.total_inr)}</p>
              <p className="text-[10px] text-slate-600">Planning range {formatINR(budget.range_low_inr)}–{formatINR(budget.range_high_inr)}</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="space-y-2">
              {budget.lines.map(line => (
                <div key={line.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 rounded-md border border-slate-200 px-3 py-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <span className="font-semibold text-slate-800">{line.label}</span>
                  <span className="text-slate-600">{line.quantity.toLocaleString('en-IN')} {line.unit} × {formatINR(line.unit_cost_inr)}</span>
                  <strong className="col-start-2 text-right text-slate-900 sm:col-start-auto">{formatINR(line.subtotal_inr)}</strong>
                </div>
              ))}
            </div>
            <aside className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
              <p className="font-bold">Assumptions & limits</p>
              {budget.assumptions.map(assumption => <p key={assumption}>• {assumption}</p>)}
              <p className="border-t border-amber-200 pt-2 font-semibold">Government cash-aid estimate: not calculated. Official eligibility and assistance rates are not connected.</p>
              <p>{budget.note}</p>
            </aside>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-800">Scenario map · {regionName}</h2>
          <span className="text-[11px] text-slate-500">{intelligence?.risk_zones.length ?? 0} zone overlays · {pois.length} mapped facilities</span>
        </div>
        <MapComponent cityLabel={regionName} bounds={bounds} pois={pois} riskZones={intelligence?.risk_zones ?? []} isLoading={isLoading} emptyMessage="Select a risk tier to draw simulated zones. Facility markers come from available region data." />
      </section>

      {insurance?.note && <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">{insurance.note}</p>}

      {isAlertOpen && tier && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px]" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="sim-alert-title" className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tier === 'RED' ? 'bg-rose-100 text-rose-700' : tier === 'ORANGE' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-800'}`}><ShieldAlert size={18} /></span>
                <div>
                  <h2 id="sim-alert-title" className="text-sm font-bold text-slate-900">{tier} zone exercise alert</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{intelligence?.ai_analysis.summary ?? 'Simulated zone conditions for demonstration.'}</p>
                </div>
              </div>
              <button type="button" aria-label="Close alert preview" onClick={() => setIsAlertOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"><X size={17} /></button>
            </header>
            <div className="space-y-4 p-5">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="sim-alert-ward">Target ward / response area
                <select id="sim-alert-ward" value={selectedWard} onChange={event => setSelectedWard(event.target.value)} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100">
                  {!locations.length && <option value={`${regionName} response area`}>{regionName} response area</option>}
                  {locations.map(location => <option key={location} value={location}>{location}</option>)}
                </select>
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-800">WhatsApp message preview</p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{whatsappPreview}</p>
                {broadcastResult?.channels.whatsapp !== 'queued' && <p className="mt-2 text-[11px] font-medium text-slate-500">Preview only. No WhatsApp message was sent.</p>}
              </div>

              <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                <ChannelStatus icon={connectionState === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />} label="Socket.IO" value={connectionState === 'connected' ? 'Connected' : connectionState === 'connecting' ? 'Connecting' : 'Disconnected'} />
                <ChannelStatus icon={<BellRing size={14} />} label="Sandbox" value={whatsappConfiguration?.delivery_configured ? 'Ready for joined recipients' : configurationError ? 'Configuration unavailable' : 'Not configured'} />
              </div>

              <label className="block text-xs font-semibold text-slate-700" htmlFor="sim-alert-whatsapp">WhatsApp recipient (optional)
                <input id="sim-alert-whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={whatsappNumber} onChange={event => setWhatsappNumber(event.target.value)} placeholder="+14155552671" className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-100" />
              </label>
              <p className="-mt-3 text-[11px] text-slate-500">Leave blank for a Socket.IO-only alert and WhatsApp preview. Recipients must have joined your Sandbox.</p>

              {broadcastError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{broadcastError}</p>}
              {broadcastResult && (
                <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  <p className="flex items-center gap-1.5 font-semibold"><CheckCircle2 size={14} /> Test alert sent over Socket.IO. WhatsApp: {broadcastResult.channels.whatsapp === 'queued' ? 'queued to the entered Sandbox number' : broadcastResult.channels.whatsapp === 'not_requested' ? 'not sent; no recipient entered' : 'not sent; Sandbox service is unavailable'}.</p>
                  <p className="mt-1">{broadcastResult.alert.title}</p>
                </div>
              )}
              {!broadcastResult && latestScenarioAlert && <p className="text-[11px] text-slate-500">A matching scenario alert was received over Socket.IO.</p>}

              <div className="flex flex-col-reverse justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                <p className="text-[10px] leading-relaxed text-slate-500">The WhatsApp recipient is optional. Without a number, the alert goes only to Socket.IO and shows a WhatsApp preview.</p>
                <button type="button" onClick={handleBroadcast} disabled={isBroadcasting || connectionState !== 'connected'} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-cyan-800 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {isBroadcasting ? <><LoaderCircle size={14} className="animate-spin" /> Sending…</> : <><BellRing size={14} /> Broadcast test alert</>}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

function ChannelStatus({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-slate-600"><span className="text-cyan-800">{icon}</span><span className="shrink-0 font-semibold text-slate-800">{label}</span><span className="truncate" title={value}>{value}</span></div>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">{icon}{label}</div>
      <div className="mt-2 truncate text-sm font-bold text-slate-900" title={value}>{value}</div>
    </div>
  );
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}
