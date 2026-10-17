import React, { useState } from 'react';
import { ArrowLeft, History, Search, Wind, Waves } from 'lucide-react';
import { HistoricalResponse } from '../api';

interface HistoricalDisastersViewProps {
  history: HistoricalResponse | null;
  isLoading: boolean;
  error: string | null;
  regionName: string;
  onBackToOverview?: () => void;
}

export const HistoricalDisastersView: React.FC<HistoricalDisastersViewProps> = ({
  history,
  isLoading,
  error,
  regionName,
  onBackToOverview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'wind' | 'distance'>('newest');
  const events = [...(history?.historical_analogs ?? [])]
    .filter(event => `${event.matched_cyclone} ${event.reference_period.start_date}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((left, right) => {
      if (sortBy === 'wind') return (right.historical_peak_wind_kmh ?? -1) - (left.historical_peak_wind_kmh ?? -1);
      if (sortBy === 'distance') return left.closest_approach_km - right.closest_approach_km;
      const leftDate = left.reference_period.start_date;
      const rightDate = right.reference_period.start_date;
      return sortBy === 'newest' ? rightDate.localeCompare(leftDate) : leftDate.localeCompare(rightDate);
    });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {onBackToOverview && (
          <button onClick={onBackToOverview} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
            <ArrowLeft size={14} /> Back to overview
          </button>
        )}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <History size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Historical Cyclone Analogs</h1>
            <p className="text-xs text-slate-500 mt-1">{regionName} · Data returned by the history API</p>
          </div>
        </div>
        
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 border border-slate-300 bg-slate-50 rounded-lg px-3 py-2 text-slate-500 w-full sm:max-w-sm">
          <Search size={15} />
          <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search cyclone or year" className="bg-transparent outline-none text-xs text-slate-900 w-full" />
        </label>
        <select value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="wind">Peak wind</option>
          <option value="distance">Closest approach</option>
        </select>
      </section>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading historical analogs…</p>
      ) : error ? (
        <p role="alert" className="py-12 text-center text-sm text-rose-700">{error}</p>
      ) : events.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">No historical analogs were returned for this region.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {history?.total_historical_events_analyzed ?? events.length} cyclone tracks · {history?.source} · refreshed {history?.timestamp ? new Date(history.timestamp).toLocaleString() : 'unknown'} · <a className="text-blue-700 underline" href={history?.source_url} target="_blank" rel="noreferrer">source</a>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {events.map((event, index) => (
              <article key={`${event.matched_cyclone}-${index}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <h2 className="font-bold text-slate-900">{event.matched_cyclone}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {event.reference_period.start_date} to {event.reference_period.end_date}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Wind size={13} /> Peak wind</div>
                    <div className="font-mono font-bold text-slate-900 mt-1">{event.historical_peak_wind_kmh == null ? 'Unavailable' : `${event.historical_peak_wind_kmh} km/h`}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Waves size={13} /> Closest approach</div>
                    <div className="font-mono font-bold text-slate-900 mt-1">{event.closest_approach_km} km</div>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Storm surge: not available in the track dataset.</p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
