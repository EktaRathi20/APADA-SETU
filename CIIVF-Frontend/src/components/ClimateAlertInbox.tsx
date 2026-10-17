import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, MapPin, Radio, Search, Wifi, WifiOff } from 'lucide-react';
import { AlertConnectionState, ClimateAlert } from '../climateAlerts';

interface ClimateAlertInboxProps {
  alerts: ClimateAlert[];
  connectionState: AlertConnectionState;
  error: string | null;
  selectedRegionKey: string;
  regionName: string;
  onBack: () => void;
}

const severityStyles: Record<ClimateAlert['severity'], string> = {
  critical: 'border-rose-300 bg-rose-50 text-rose-800',
  high: 'border-orange-300 bg-orange-50 text-orange-800',
  moderate: 'border-amber-300 bg-amber-50 text-amber-900',
  low: 'border-sky-300 bg-sky-50 text-sky-800',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
};

export function ClimateAlertInbox({
  alerts,
  connectionState,
  error,
  selectedRegionKey,
  regionName,
  onBack,
}: ClimateAlertInboxProps) {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'selected'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(alerts[0]?.id ?? null);

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      const inRegion = regionFilter === 'all' || alert.location.region_key === selectedRegionKey;
      const searchable = [
        alert.title,
        alert.description,
        alert.hazard_type,
        alert.location.name,
        alert.source,
      ].join(' ').toLowerCase();
      return inRegion && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [alerts, query, regionFilter, selectedRegionKey]);

  useEffect(() => {
    if (!selectedId || !filteredAlerts.some((alert) => alert.id === selectedId)) {
      setSelectedId(filteredAlerts[0]?.id ?? null);
    }
  }, [filteredAlerts, selectedId]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedId) ?? null;

  return (
    <section className="space-y-4" aria-label="Climate alerts">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" aria-label="Back to dashboard">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Climate alerts</h1>
            <p className="text-xs text-slate-500">Live hazard notices across monitored locations</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${connectionState === 'connected' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {connectionState === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connectionState === 'connected' ? 'Live connection' : connectionState === 'connecting' ? 'Connecting…' : 'Live connection unavailable'}
        </div>
      </header>

      {error && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}. Live alerts may still arrive over Socket.IO.</p>}

      <div className="grid min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
        <section className="flex min-h-0 flex-col border-r-0 border-slate-200 lg:border-r lg:pr-4" aria-label="Alert list">
          <div className="mb-3 flex flex-wrap gap-2">
            <label className="relative min-w-[160px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alerts" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500" />
            </label>
            <select aria-label="Alert location filter" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value as 'all' | 'selected')} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700">
              <option value="all">All locations</option>
              <option value="selected">{regionName}</option>
            </select>
          </div>
          <p className="mb-2 text-[11px] font-medium text-slate-500">{filteredAlerts.length} alert{filteredAlerts.length === 1 ? '' : 's'}</p>
          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => (
              <button key={alert.id} onClick={() => setSelectedId(alert.id)} className={`w-full rounded-md border p-3 text-left transition-colors ${selectedId === alert.id ? 'border-blue-400 bg-blue-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase ${severityStyles[alert.severity]}`}>{alert.severity}</span>
                  <time className="text-[10px] text-slate-500">{formatDate(alert.observed_at)}</time>
                </div>
                <h2 className="mt-2 text-sm font-semibold text-slate-900">{alert.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{alert.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <MapPin size={12} />
                  <span className="truncate">{alert.location.name}</span>
                  <span className="text-slate-300">·</span>
                  <span className="truncate">{alert.hazard_type}</span>
                </div>
              </button>
            ))}
            {filteredAlerts.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center">
                <AlertTriangle size={22} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">No alerts match</p>
                <p className="mt-1 text-xs text-slate-500">New notices will appear here when a connected source reports them.</p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0" aria-label="Alert details">
          {selectedAlert ? (
            <article className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm border px-2 py-1 text-[10px] font-bold uppercase ${severityStyles[selectedAlert.severity]}`}>{selectedAlert.severity}</span>
                    <span className="rounded-sm bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">{selectedAlert.hazard_type}</span>
                  </div>
                  <h2 className="text-xl font-bold leading-snug text-slate-900">{selectedAlert.title}</h2>
                </div>
                <Radio size={18} className={connectionState === 'connected' ? 'text-emerald-600' : 'text-slate-400'} aria-label="Alert event stream" />
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Description</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail label="Location" value={selectedAlert.location.name} />
                <Detail label="Region key" value={selectedAlert.location.region_key ?? 'Not provided'} />
                <Detail label="Coordinates" value={selectedAlert.location.latitude === null || selectedAlert.location.longitude === null ? 'Not provided' : `${selectedAlert.location.latitude}, ${selectedAlert.location.longitude}`} />
                <Detail label="Source" value={selectedAlert.source} />
                <Detail label="Observed at" value={formatDate(selectedAlert.observed_at)} />
                <Detail label="Received by CIIVF" value={formatDate(selectedAlert.received_at)} />
              </div>

              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Measurements and provider data</h3>
                {Object.keys(selectedAlert.measurements).length ? (
                  <dl className="divide-y divide-slate-200 border-y border-slate-200">
                    {Object.entries(selectedAlert.measurements).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[minmax(120px,0.6fr)_minmax(0,1fr)] gap-3 py-2 text-xs">
                        <dt className="break-words font-medium text-slate-600">{key.replaceAll('_', ' ')}</dt>
                        <dd className="break-words text-slate-900">{typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="text-xs text-slate-500">No additional measurements were provided.</p>}
              </div>

              <p className="break-all font-mono text-[10px] text-slate-400">Alert ID: {selectedAlert.id}</p>
            </article>
          ) : (
            <div className="grid min-h-[320px] place-items-center rounded-md border border-dashed border-slate-300 text-center">
              <div>
                <AlertTriangle size={24} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">Select an alert to inspect its details</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-slate-200 pl-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-xs text-slate-800">{value}</dd>
    </div>
  );
}