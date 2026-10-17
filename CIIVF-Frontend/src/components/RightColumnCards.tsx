import React from 'react';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { CityLocation } from '../types';
import { AlertConnectionState, ClimateAlert } from '../climateAlerts';

interface RightColumnCardsProps {
  city: CityLocation;
  alerts: ClimateAlert[];
  connectionState: AlertConnectionState;
  onOpenAlerts: () => void;
  isLightMode?: boolean;
}

export const RightColumnCards: React.FC<RightColumnCardsProps> = ({ city, alerts, connectionState, onOpenAlerts, isLightMode = true }) => {
  const panelClass = isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900/90 border-slate-800';
  const titleClass = isLightMode ? 'text-slate-900' : 'text-slate-100';
  const mutedClass = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const regionAlerts = alerts.filter(alert => !alert.location.region_key || alert.location.region_key === city.id).slice(0, 3);

  return (
    <div className="space-y-4">
      <section className={`border rounded-xl p-3.5 ${panelClass}`}>
        <h2 className={`flex items-center gap-2 font-bold text-sm ${titleClass}`}>
          <Database size={15} className="text-blue-600" /> Backend Data Sources
        </h2>
        <div className="space-y-2 mt-3">
          {city.evidenceQuality.items.map(source => (
            <div key={source.label} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className={titleClass}>{source.label}</span>
                <span className={`flex items-center gap-1 ${source.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <CheckCircle2 size={13} /> {source.available ? 'Connected' : 'Unavailable'}
                </span>
              </div>
              {!source.available && source.detail && <p className="mt-1 break-words text-[10px] leading-relaxed text-amber-800">{source.detail}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className={`border rounded-xl p-3.5 ${panelClass}`}>
        <h2 className={`flex items-center gap-2 font-bold text-sm ${titleClass}`}>
          <AlertCircle size={15} className="text-amber-600" /> Climate Alerts
        </h2>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className={mutedClass}>{regionAlerts.length} recent for this location</span>
          <span className={connectionState === 'connected' ? 'text-emerald-700' : 'text-amber-800'}>
            {connectionState === 'connected' ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {regionAlerts.map(alert => (
            <button key={alert.id} onClick={onOpenAlerts} className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-left hover:bg-slate-50">
              <span className="block truncate text-xs font-semibold text-slate-900">{alert.title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                {alert.severity.toUpperCase()} · {alert.hazard_type} · {alert.location.name}
              </span>
              <span className="mt-1 block line-clamp-2 text-[10px] leading-relaxed text-slate-600">{alert.description}</span>
            </button>
          ))}
          {regionAlerts.length === 0 && (
            <p className={`rounded-md bg-slate-50 px-2.5 py-3 text-xs ${mutedClass}`}>
              No reported climate alerts for this location.
            </p>
          )}
        </div>
        <button onClick={onOpenAlerts} className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900">
          View all alerts
        </button>
      </section>
    </div>
  );
};
