import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  ArrowRight, 
  Database, 
  Server, 
  Radio, 
  Lock, 
  Users, 
  Hospital, 
  Zap, 
  Layers, 
  Droplets,
  Wind,
  Compass,
  RefreshCw,
  Eye,
  AlertTriangle,
  History,
  CloudRain,
  Leaf
} from 'lucide-react';
import { UserRole, CityLocation } from '../../types';
import { HistoricalAndPopulationPanel } from './HistoricalAndPopulationPanel';
import { SevenDayForecastPanel } from './SevenDayForecastPanel';

export interface BaselineModeViewProps {
  city?: CityLocation;
  showMangroveLayer?: boolean;
  onToggleMangrove?: (val: boolean) => void;
  showHistoricalLayer?: boolean;
  onToggleHistorical?: (val: boolean) => void;
  isLightMode?: boolean;
  selectedRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
  onAdvanceToPhase2?: () => void;
}

export const BaselineModeView: React.FC<BaselineModeViewProps> = ({
  city,
  showMangroveLayer = true,
  onToggleMangrove,
  showHistoricalLayer = false,
  onToggleHistorical,
  isLightMode = true,
  selectedRole: controlledRole,
  onSelectRole,
  onAdvanceToPhase2,
}) => {
  const [internalRole, setInternalRole] = useState<UserRole>('municipal_commissioner');
  const activeRole = controlledRole || internalRole;

  const handleRoleChange = (role: UserRole) => {
    if (onSelectRole) {
      onSelectRole(role);
    } else {
      setInternalRole(role);
    }
  };

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  
  // Layer toggles for Step 2: Digital Twin Map
  const [showPopulation, setShowPopulation] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showMangroves, setShowMangroves] = useState(showMangroveLayer);
  const [selectedAsset, setSelectedAsset] = useState<string | null>('General Hospital');

  // Meteorological telemetry state
  const [fetchPulse, setFetchPulse] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState('Just now');
  const [barometerValue, setBarometerValue] = useState(1012.6);
  const [windValue, setWindValue] = useState(14.2);

  // Background meteorological fetcher continuous polling simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFetchPulse((prev) => prev + 1);
      setLastFetchTime('Just now');
      // Subtle natural fluctuations
      setBarometerValue(Number((1012.4 + Math.random() * 0.4).toFixed(1)));
      setWindValue(Number((13.8 + Math.random() * 0.8).toFixed(1)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    {
      id: 'municipal_commissioner' as UserRole,
      title: 'Municipal Commissioner',
      officer: 'Dr. Aarav Sundaram, IAS',
      perms: 'Order Evacuation · Approve State Disaster Relief Fund (SDRF) allocation',
      badge: 'Level 5 Admin',
    },
    {
      id: 'disaster_officer' as UserRole,
      title: 'Chief Disaster Officer',
      officer: 'Col. Vikram Rathore (Retd.)',
      perms: 'Deploy NDRF / SDRF units · Manage Emergency Logistics Corridor',
      badge: 'Level 4 Tactical',
    },
    {
      id: 'ward_engineer' as UserRole,
      title: 'Ward 17 Resiliency Engineer',
      officer: 'Er. Ananya Sharma',
      perms: 'Monitor Sluice Gates · Telemetry Sensors · Sandbag Pre-positioning',
      badge: 'Level 3 Field Ops',
    },
    {
      id: 'insurance_underwriter' as UserRole,
      title: 'Parametric Risk Adjuster',
      officer: 'Marcus Vance, FSA',
      perms: 'Audit Sentinel-1 SAR satellite oracle & automated smart contract payouts',
      badge: 'Oracle Auditor',
    },
  ];

  const currentRoleObj = roles.find((r) => r.id === activeRole) || roles[0];

  const cityName = city?.name || 'Visakhapatnam & Coastal Basin';
  const coordinates = city?.coordinatesFormatted || '17.68° N, 83.21° E';

  return (
    <div className="space-y-6">
      {/* Top Banner: Baseline Intelligence / Safe Mode Protocol */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border border-emerald-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-800">
                BASELINE INTELLIGENCE // SAFE MODE PROTOCOL
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase shadow-2xs">
                Phase 1 Active
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Region: {cityName}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">
              Normal Multi-Hazard Readiness & Resilient Bio-Shield
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Continuous background telemetry ingestion, empirical digital twin monitoring, and coastal defense audit.
            </p>
          </div>
        </div>

        {/* Action button if Phase 2 advance is available */}
        {onAdvanceToPhase2 && (
          <button
            onClick={onAdvanceToPhase2}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-xs shrink-0"
          >
            <span>Trigger Amber Phase 2</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Switcher Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Operational Role Credential & RBAC Access Level
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Current: <strong className="text-slate-800">{currentRoleObj.officer}</strong> ({currentRoleObj.badge})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {roles.map((r) => {
            const isSelected = r.id === activeRole;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {r.badge}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-700 mt-1">{r.officer}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{r.perms}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Bento Grid: Digital Twin & Background Meteorological Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* STEP 2: Safe Mode Municipal Digital Twin Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                Municipal Digital Twin Canvas
              </h3>
              <p className="text-[11px] text-slate-500">
                Baseline population density, 4 trauma centers, sluice gates, and tidal monitoring
              </p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              SCADA Real-time Synced
            </span>
          </div>

          {/* Interactive Layer Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            <span className="text-[11px] font-bold text-slate-500">Layers:</span>
            <button
              onClick={() => setShowPopulation(!showPopulation)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                showPopulation
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Population Density</span>
            </button>
            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                showHospitals
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Hospital className="w-3 h-3" />
              <span>Hospitals (4)</span>
            </button>
            <button
              onClick={() => setShowInfrastructure(!showInfrastructure)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                showInfrastructure
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Substations & Sluices</span>
            </button>
            <button
              onClick={() => {
                setShowMangroves(!showMangroves);
                if (onToggleMangrove) onToggleMangrove(!showMangroves);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                showMangroves
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Leaf className="w-3 h-3" />
              <span>Mangrove Bio-Shield</span>
            </button>
          </div>

          {/* Digital Twin Interactive Schematic Map Canvas */}
          <div className="h-80 rounded-xl border border-slate-300 relative overflow-hidden bg-slate-100 flex flex-col justify-between p-3 select-none">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e140_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e140_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]"></div>

            {/* Ocean Bay on the right side */}
            <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-blue-100/90 border-l-2 border-blue-300 flex items-center justify-center">
              <div className="text-center p-2">
                <span className="text-xs font-bold text-blue-900 block">Bay Coastal Margin</span>
                <span className="text-[10px] text-blue-700">Tidal Gauge: +0.28m (Normal)</span>
                <span className="block mt-1 px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 text-[9px] font-mono">
                  Calm Sea State 1
                </span>
              </div>
            </div>

            {/* Mangrove Bio-Shield overlay on coastal margin */}
            {showMangroves && (
              <div className="absolute right-[37%] top-4 bottom-4 w-12 bg-emerald-600/30 border-y-2 border-x-2 border-emerald-500 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                <Leaf className="w-4 h-4 text-emerald-800" />
                <span className="text-[8px] font-bold text-emerald-950 uppercase rotate-90 whitespace-nowrap mt-2">
                  Mangrove Shield (-64%)
                </span>
              </div>
            )}

            {/* Drainage Canal 4 flowing to bay */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3/5 h-6 bg-sky-200/90 border-y border-sky-400 flex items-center px-2">
              <span className="text-[9px] font-mono font-bold text-sky-900">Drainage Canal 4 (Depth 0.42m - Capacity 2.5m)</span>
            </div>

            {/* Population Density Heat Overlay */}
            {showPopulation && (
              <>
                <div className="absolute left-2 top-2 w-36 h-24 bg-amber-200/50 border border-amber-400/80 rounded-xl p-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-amber-950 block">Ward 1–12 (Inland)</span>
                  <span className="text-[9px] text-amber-900">Density: 6,800/km²</span>
                </div>
                <div className="absolute left-28 bottom-2 w-44 h-24 bg-orange-200/60 border border-orange-400/80 rounded-xl p-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-950 block">Ward 17 (Estuary Basin)</span>
                  <span className="text-[9px] text-orange-900 font-semibold">Density: 14,200/km² (High)</span>
                </div>
              </>
            )}

            {/* Hospitals Pins */}
            {showHospitals && (
              <>
                <div 
                  onClick={() => setSelectedAsset('Municipal General Hospital')}
                  className="absolute left-6 top-8 z-20 cursor-pointer group"
                  title="Municipal General Hospital"
                >
                  <div className="p-1 rounded-lg bg-rose-600 text-white shadow-md flex items-center gap-1 hover:scale-110 transition">
                    <Hospital className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold pr-1">General Hosp (450 Beds)</span>
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedAsset('Coastal Maternity & Trauma Clinic')}
                  className="absolute left-20 bottom-12 z-20 cursor-pointer group"
                  title="Coastal Maternity & Trauma Clinic"
                >
                  <div className="p-1 rounded-lg bg-rose-600 text-white shadow-md flex items-center gap-1 hover:scale-110 transition">
                    <Hospital className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold pr-1">Maternity (180 Beds)</span>
                  </div>
                </div>
              </>
            )}

            {/* Infrastructure Pins */}
            {showInfrastructure && (
              <>
                <div 
                  onClick={() => setSelectedAsset('Power Substation A (Estuary Margin)')}
                  className="absolute left-40 top-16 z-20 cursor-pointer group"
                  title="Power Substation A"
                >
                  <div className="p-1 rounded-lg bg-amber-600 text-white shadow-md flex items-center gap-1 hover:scale-110 transition">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold pr-1">Substation A (132kV)</span>
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedAsset('Canal 4 Estuary Sluice Gates (1-4)')}
                  className="absolute left-44 top-36 z-20 cursor-pointer group"
                  title="Estuary Sluice Gates"
                >
                  <div className="p-1 rounded-lg bg-blue-700 text-white shadow-md flex items-center gap-1 hover:scale-110 transition">
                    <Droplets className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold pr-1">Sluice 1-4 (Open 100%)</span>
                  </div>
                </div>
              </>
            )}

            {/* Top Coordinate Bar */}
            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-white/95 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-700 border border-slate-300">
                Digital Twin: {cityName} Wards 1-17
              </span>
              <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-600">
                {coordinates}
              </span>
            </div>

            {/* Bottom Status Pill */}
            <div className="relative z-10 flex justify-between items-end">
              <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 border border-slate-300 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>All Lifeline Infrastructure Operating Normally</span>
              </div>
              <span className="bg-white/90 px-2 py-0.5 rounded text-[10px] text-slate-500">
                1:10,000 SCADA Synced
              </span>
            </div>
          </div>

          {/* Selected Asset Inspection Box */}
          {selectedAsset && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Selected Digital Twin Asset:</span>
                <span className="font-bold text-slate-900">{selectedAsset}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Telemetry: 100% Operational
              </span>
            </div>
          )}
        </div>

        {/* STEP 3: Continuous Background Meteorological Data Fetcher (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                Live Meteorological Fetcher
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-semibold rounded-full">
                15s Realtime Ingest
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Background workers actively stream live Doppler radar feeds and synoptic pressure models every 15 seconds.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-500" />
                    Barometric Pressure
                  </span>
                  <span className="font-mono font-bold text-slate-900">{barometerValue} hPa</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  Steady baseline · No cyclonic depression detected
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-slate-500" />
                    Surface Wind Velocity
                  </span>
                  <span className="font-mono font-bold text-slate-900">{windValue} km/h</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Direction: East-Northeast · Gentle Breeze
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-slate-500" />
                    Sea Surface Temp (SST)
                  </span>
                  <span className="font-mono font-bold text-slate-900">29.3 °C</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Bay of Bengal Ocean Buoy #BD08
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    IMD Doppler Radar
                  </span>
                  <span className="font-mono font-bold text-emerald-700">Online</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Station VSKP-01 · Pulse Ingest #{fetchPulse}
                </div>
              </div>
            </div>
          </div>

          {/* Polling Health & Simulation Trigger */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setIsWeatherModalOpen(true)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <CloudRain className="w-4 h-4 text-blue-600" />
              <span>Open 7-Day Predictive Weather Forecast</span>
            </button>

            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-[11px] text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                Live Meteorological Ingest Active
              </span>
              <span className="font-mono text-blue-700 text-[10px]">{lastFetchTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Disaster Fingerprint & Ward Population Impact Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <HistoricalAndPopulationPanel region={city?.id || "vizag"} isEmbedded={true} defaultTab="fingerprint" />
      </div>

      {/* 7-Day Predictive Weather Modal */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <SevenDayForecastPanel
              region={cityName}
              isOpen={true}
              onClose={() => setIsWeatherModalOpen(false)}
              isEmbedded={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Also export Phase1Normal as alias for backwards compatibility
export const Phase1Normal = BaselineModeView;
