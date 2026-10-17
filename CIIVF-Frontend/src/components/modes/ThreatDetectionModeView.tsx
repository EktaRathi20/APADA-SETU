import React from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, Clock3, LoaderCircle, Map, ShieldAlert, Wind } from 'lucide-react';
import { ApiRegion, DisasterIntelligenceResponse } from '../../api';
import { CityLocation, MapPOI } from '../../types';
import { MapComponent } from '../MapComponent';

interface ThreatDetectionModeViewProps {
  city: CityLocation;
  bounds: ApiRegion;
  pois: MapPOI[];
  disasterIntelligence: DisasterIntelligenceResponse | null;
  isLoading: boolean;
  error: string | null;
  showMangroveLayer: boolean;
  onToggleMangrove: (value: boolean) => void;
  showHistoricalLayer: boolean;
  onToggleHistorical: (value: boolean) => void;
  isLightMode?: boolean;
}

const riskTone: Record<string, string> = {
  RED: 'border-rose-200 bg-rose-50 text-rose-800',
  ORANGE: 'border-orange-200 bg-orange-50 text-orange-800',
  YELLOW: 'border-amber-200 bg-amber-50 text-amber-800',
  GREEN: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  UNKNOWN: 'border-slate-200 bg-slate-50 text-slate-600',
};

const formatValue = (value: number | null | undefined, unit: string, digits = 0, isLoading = false) =>
  value == null ? isLoading ? 'Loading…' : 'Unavailable' : `${value.toFixed(digits)}${unit}`;

export const ThreatDetectionModeView: React.FC<ThreatDetectionModeViewProps> = ({
  city,
  bounds,
  pois,
  disasterIntelligence,
  isLoading,
  error,
  showMangroveLayer,
  onToggleMangrove,
  showHistoricalLayer,
  onToggleHistorical,
}) => {
  const assessment = disasterIntelligence?.risk_assessment;
  const conditions = disasterIntelligence?.current_conditions;
  const zones = disasterIntelligence?.risk_zones ?? [];
  const analysis = disasterIntelligence?.ai_analysis;
  const dataUnavailable = disasterIntelligence?.data_quality.telemetry_status !== 'AVAILABLE';
  const riskLevel = assessment?.level ?? 'UNKNOWN';

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${riskTone[riskLevel] ?? riskTone.UNKNOWN}`}>
            {dataUnavailable ? <CircleHelp size={21} /> : <ShieldAlert size={21} />}
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Threat Detection · {city.name}</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {isLoading ? 'Refreshing disaster intelligence…' : error ?? assessment?.note ?? 'Risk screening from current backend telemetry'}
            </p>
          </div>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${riskTone[riskLevel] ?? riskTone.UNKNOWN}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {dataUnavailable ? 'DATA UNAVAILABLE' : `${riskLevel} RISK`}
        </div>
      </section>

      {disasterIntelligence?.data_quality.ingestion_error && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Ingestion is incomplete: {disasterIntelligence.data_quality.ingestion_error}
        </div>
      )}
      {isLoading && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-950"><LoaderCircle size={14} className="animate-spin" />Loading live telemetry, history, and response resources…</div>}
      {error && !disasterIntelligence && (
        <div role="status" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          Disaster intelligence could not be loaded: {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<ShieldAlert size={16} />} label="Risk score" value={assessment ? `${assessment.score}/100` : 'Unavailable'} detail={assessment?.method ?? 'Waiting for API response'} />
        <Metric icon={<Wind size={16} />} label="Wind speed" value={formatValue(conditions?.wind_speed_kmh, ' km/h', 1, isLoading)} detail="Current observation" />
        <Metric icon={<AlertTriangle size={16} />} label="Storm surge" value={formatValue(conditions?.storm_surge_meters, ' m', 2, isLoading)} detail="Measured source value only" />
        <Metric icon={<Map size={16} />} label="Screening zones" value={String(zones.length)} detail="Returned by disaster intelligence" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><Map size={16} className="text-blue-700" /> Response risk zones</h2>
            <span className="text-[11px] text-slate-500">{zones.length} mapped</span>
          </div>
          <MapComponent
            showMangroveLayer={showMangroveLayer}
            onToggleMangrove={onToggleMangrove}
            showHistoricalLayer={showHistoricalLayer}
            onToggleHistorical={onToggleHistorical}
            pois={pois}
            cityLabel={city.name}
            bounds={bounds}
            riskZones={zones}
            isLoading={isLoading}
            emptyMessage="The API returned no facility coordinates for this region."
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-4">
          <h2 className="text-sm font-bold text-slate-900">Assessment details</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{assessment?.note ?? 'Risk assessment will appear when the API responds.'}</p>
          <div className="mt-4 space-y-2">
            <Fact label="Pressure" value={formatValue(conditions?.pressure_hpa, ' hPa', 1)} />
            <Fact label="Telemetry status" value={disasterIntelligence?.data_quality.telemetry_status ?? (isLoading ? 'Loading' : 'Unavailable')} />
            <Fact label="Historical analog" value={disasterIntelligence?.historical_context.primary_analog ?? 'Unavailable'} />
            {assessment?.factors.map((factor, index) => (
              <div key={`${factor}-${index}`} className="flex gap-2 rounded-md bg-slate-50 p-2 text-xs leading-relaxed text-slate-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />{factor}
              </div>
            ))}
            {assessment && disasterIntelligence?.data_quality.telemetry_status === 'AVAILABLE' && assessment.factors.length === 0 && (
              <div className="flex gap-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
                <CheckCircle2 size={14} className="shrink-0" />No elevated screening factors were returned.
              </div>
            )}
            {disasterIntelligence && disasterIntelligence.data_quality.telemetry_status !== 'AVAILABLE' && (
              <div className="flex gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                <CircleHelp size={14} className="shrink-0" />Risk factors cannot be assessed without current telemetry.
              </div>
            )}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500"><Clock3 size={13} /> AI analysis</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{analysis?.summary ?? (isLoading ? 'Analysis is loading.' : 'AI analysis unavailable for this response.')}</p>
            {analysis?.reasoning_context.length ? <p className="mt-2 text-[11px] text-slate-500">Evidence: {analysis.reasoning_context.join(' · ')}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">{icon}{label}</div>
      <div className="mt-2 truncate text-lg font-black text-slate-900">{value}</div>
      <div className="mt-1 truncate text-[10px] text-slate-500" title={detail}>{detail}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-xs">
      <span className="shrink-0 text-slate-500">{label}</span>
      <strong className="max-w-[65%] truncate text-right text-slate-800" title={value}>{value}</strong>
    </div>
  );
}