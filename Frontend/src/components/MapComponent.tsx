import React, { useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Hospital, Home, LoaderCircle, MapPin } from 'lucide-react';
import { ApiRegion, DisasterRiskZone } from '../api';
import { MapPOI } from '../types';

interface MapComponentProps {
  showMangroveLayer?: boolean;
  onToggleMangrove?: (value: boolean) => void;
  showHistoricalLayer?: boolean;
  onToggleHistorical?: (value: boolean) => void;
  showWard17Box?: boolean;
  showSafeCorridor?: boolean;
  systemStatusLabel?: string;
  systemStatusColor?: 'green' | 'amber' | 'red';
  windSpeedSim?: number;
  interactive?: boolean;
  isLightMode?: boolean;
  pois?: MapPOI[];
  cityLabel?: string;
  bounds?: ApiRegion;
  riskZones?: DisasterRiskZone[];
  emptyMessage?: string;
  isLoading?: boolean;
}

function FitRegionBounds({ bounds }: { bounds: ApiRegion }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(
      [
        [bounds.min_lat, bounds.min_lon],
        [bounds.max_lat, bounds.max_lon],
      ],
      { padding: [28, 28], maxZoom: 11 },
    );
  }, [bounds.max_lat, bounds.max_lon, bounds.min_lat, bounds.min_lon, map]);

  return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  pois = [],
  cityLabel = 'Selected region',
  bounds,
  riskZones = [],
  emptyMessage = 'No mapped facility coordinates were returned.',
  isLoading = false,
}) => {
  const [activeType, setActiveType] = useState<'all' | 'shelter' | 'hospital'>('all');
  const visiblePois = pois.filter(poi =>
    (activeType === 'all' || poi.type === activeType) && poi.lat != null && poi.lon != null,
  );
  const visibleZones = riskZones.filter(
    (zone): zone is typeof zone & { lat: number; lon: number } =>
      Number.isFinite(zone.lat) && Number.isFinite(zone.lon) && zone.radius_km > 0,
  );
  const center: [number, number] = bounds
    ? [(bounds.min_lat + bounds.max_lat) / 2, (bounds.min_lon + bounds.max_lon) / 2]
    : [17.6868, 83.2185];

  return (
    <section className="relative h-[440px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs md:h-[480px] z-0">
      <MapContainer key={cityLabel} center={center} zoom={8} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitRegionBounds bounds={bounds} />}
        {visibleZones.map(zone => {
          const zoneColor = {
            red: { stroke: '#dc2626', fill: '#ef4444' },
            orange: { stroke: '#ea580c', fill: '#f97316' },
            yellow: { stroke: '#d97706', fill: '#fbbf24' },
            green: { stroke: '#059669', fill: '#10b981' },
          }[zone.color];
          return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lon]}
            radius={zone.radius_km * 1000}
            pathOptions={{
              color: zoneColor.stroke,
              weight: 2,
              fillColor: zoneColor.fill,
              fillOpacity: 0.18,
              dashArray: '8 8',
            }}
          >
            <Popup>
              <div className="min-w-36">
                <div className="font-semibold text-slate-900">{zone.label}</div>
                <p className="mt-1 text-xs text-slate-600">{zone.description ?? 'Risk zone from disaster intelligence'}</p>
              </div>
            </Popup>
          </Circle>
          );
        })}
        {visiblePois.map(poi => (
          <CircleMarker
            key={poi.id}
            center={[poi.lat!, poi.lon!] as [number, number]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: poi.type === 'shelter' ? '#059669' : '#e11d48',
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <div className="min-w-36">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  {poi.type === 'shelter' ? <Home size={14} /> : <Hospital size={14} />}
                  {poi.name}
                </div>
                <p className="mt-1 text-xs text-slate-600">{poi.details ?? 'Address not provided'}</p>
                <p className="mt-1 text-[10px] text-slate-500">{poi.lat?.toFixed(5)}, {poi.lon?.toFixed(5)}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="absolute left-3 top-3 z-[1000] max-w-[55%] rounded-md border border-white/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-900">{cityLabel}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-600">
          <MapPin size={11} /> {visiblePois.length} facilities · {visibleZones.length} risk zones
        </div>
      </div>

      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm">
        {(['all', 'shelter', 'hospital'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            aria-pressed={activeType === type}
            className={`rounded px-2 py-1.5 text-[11px] font-semibold capitalize ${activeType === type ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {type === 'all' ? 'All' : type === 'shelter' ? 'Shelters' : 'Hospitals'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-4 top-1/2 z-[900] mx-auto flex max-w-lg -translate-y-1/2 items-center justify-center gap-2 rounded-md border border-cyan-200 bg-white/95 px-4 py-3 text-center text-xs font-medium text-cyan-950 shadow-sm">
          <LoaderCircle size={15} className="animate-spin" /> Loading map facilities and risk layers…
        </div>
      ) : visiblePois.length === 0 && visibleZones.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-4 top-1/2 z-[900] mx-auto max-w-lg -translate-y-1/2 rounded-md border border-slate-200 bg-white/95 px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">No facility markers for {cityLabel}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{emptyMessage}</p>
        </div>
      ) : null}
    </section>
  );
};
