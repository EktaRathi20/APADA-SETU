import React, { useState } from 'react';
import { 
  History, 
  Users, 
  ShieldCheck, 
  Leaf, 
  Waves, 
  ChevronRight, 
  AlertTriangle,
  Building2,
  Hospital,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { HISTORICAL_DISASTERS } from '../../data/mockData';

interface HistoricalAndPopulationPanelProps {
  region?: string;
  isEmbedded?: boolean;
  defaultTab?: 'fingerprint' | 'population' | 'impact';
  onClose?: () => void;
}

export const HistoricalAndPopulationPanel: React.FC<HistoricalAndPopulationPanelProps> = ({
  region = 'vizag',
  isEmbedded = true,
  defaultTab = 'fingerprint',
}) => {
  const [activeTab, setActiveTab] = useState<'fingerprint' | 'population' | 'bioshield'>(
    defaultTab === 'fingerprint' ? 'fingerprint' : 'population'
  );
  const [selectedAnalogId, setSelectedAnalogId] = useState<string>('cyclone-amphan-2020');

  const selectedDisaster = HISTORICAL_DISASTERS.find(d => d.id === selectedAnalogId) || HISTORICAL_DISASTERS[0];

  return (
    <div className="space-y-4">
      {/* Header and Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Historical Disaster Fingerprint & Ward Vulnerability
          </h3>
          <p className="text-xs text-slate-500">
            Empirical storm surge footprints, analog pattern matching, and demographic vulnerability indices
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('fingerprint')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'fingerprint'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Analog Fingerprints</span>
          </button>
          <button
            onClick={() => setActiveTab('population')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'population'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ward Demographics</span>
          </button>
          <button
            onClick={() => setActiveTab('bioshield')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'bioshield'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bio-Shield Attenuation</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Historical Analog Fingerprints */}
      {activeTab === 'fingerprint' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {HISTORICAL_DISASTERS.slice(0, 3).map((disaster) => {
              const isSelected = disaster.id === selectedAnalogId;
              return (
                <div
                  key={disaster.id}
                  onClick={() => setSelectedAnalogId(disaster.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{disaster.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                      {disaster.year}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 font-medium">
                    {disaster.category}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Max Gusts: <strong className="text-slate-800 font-mono">{disaster.windSpeedMaxKmH} km/h</strong></span>
                    <span className="text-slate-500">Surge: <strong className="text-slate-800 font-mono">{disaster.stormSurge}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Analog Details Card */}
          {selectedDisaster && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedDisaster.name} ({selectedDisaster.year})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {selectedDisaster.hazardType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Impact Zone: {selectedDisaster.impactedAreas}
                  </p>
                </div>
                <div className="text-xs text-slate-600 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Satellite Ingest: {selectedDisaster.satelliteTag}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Wards Inundated</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{selectedDisaster.inundatedWardsCount} Wards</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Storm Surge</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{selectedDisaster.surgeHeightM}m MSL</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Evacuated</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{selectedDisaster.displaced}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Direct Economic Impact</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{selectedDisaster.economicDamage}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Key Retrospective Lessons Applied to Current Protocol:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {selectedDisaster.lessonsApplied.map((lesson, i) => (
                    <li key={i}>{lesson}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ward Population & Demographics */}
      {activeTab === 'population' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950">Ward 17 (Estuary Basin)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900">Highest Risk</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Direct sea exposure, canal junction, low elevation (1.8m)</p>
              <div className="mt-3 pt-2 border-t border-orange-200/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Population:</span>
                  <span className="font-mono font-bold text-slate-900">68,400</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Density:</span>
                  <span className="font-mono font-bold text-slate-900">14,200/km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Elderly / Minors:</span>
                  <span className="font-mono font-bold text-orange-800">22.4% (15,320)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">Ward 8 (Port & Harbor)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Moderate Risk</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Industrial port margin, coastal fishing settlements</p>
              <div className="mt-3 pt-2 border-t border-amber-200/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Population:</span>
                  <span className="font-mono font-bold text-slate-900">42,100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Density:</span>
                  <span className="font-mono font-bold text-slate-900">9,100/km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shelter Coverage:</span>
                  <span className="font-mono font-bold text-amber-800">4 Shelters (12,000 cap)</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">Ward 1–12 (Inland Core)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">Safe Baseline</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">Higher elevation (8–14m MSL), storm water culverts clear</p>
              <div className="mt-3 pt-2 border-t border-emerald-200/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Population:</span>
                  <span className="font-mono font-bold text-slate-900">186,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Density:</span>
                  <span className="font-mono font-bold text-slate-900">6,800/km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Major Hospitals:</span>
                  <span className="font-mono font-bold text-emerald-800">3 Level-1 Trauma Ctrs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mangrove Bio-Shield */}
      {activeTab === 'bioshield' && (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Coastal Mangrove Bio-Shield Natural Defense Grid
                </h4>
                <p className="text-[11px] text-slate-600">
                  Estuarine Rhizophora and Avicennia mangrove canopy attenuation telemetry
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
              64% Wave Dampening
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Canopy Extent</span>
              <span className="text-sm font-mono font-bold text-emerald-800">4,260 Hectares</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Surge Reduction</span>
              <span className="text-sm font-mono font-bold text-emerald-800">-0.85m to -1.2m</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Protected Population</span>
              <span className="text-sm font-mono font-bold text-emerald-800">114,000 Coastal Residents</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">UNEP Carbon Offset</span>
              <span className="text-sm font-mono font-bold text-emerald-800">38,200 Tons CO₂e/yr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
