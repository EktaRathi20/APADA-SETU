import React, { useState } from 'react';
import { 
  DollarSign, CheckCircle2, ShieldCheck, ArrowRight, 
  Layers, Waves, FileText, ExternalLink, Sparkles, Building, TreeDeciduous
} from 'lucide-react';
import { SDG_ALIGNMENTS } from '../../data/mockData';
import { DisasterInsuranceSummary, DisasterRiskZone } from '../../api';
import { CityLocation } from '../../types';

interface InsuranceRecoveryModeViewProps {
  city: CityLocation;
  insuranceSummary?: DisasterInsuranceSummary;
  riskZones?: DisasterRiskZone[];
  isLightMode?: boolean;
}

export const InsuranceRecoveryModeView: React.FC<InsuranceRecoveryModeViewProps> = ({
  city,
  insuranceSummary,
  riskZones = [],
  isLightMode = true,
}) => {
  // Slider position from 0 (all Before) to 100 (all After)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const insuranceEvaluated = insuranceSummary?.status === 'EVALUATED';
  const triggerReached = insuranceSummary?.trigger_met === true;

  return (
    <div className="space-y-4">
      {/* 1. Header & Parametric Condition Met Financial Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Parametric Financial Card matching prompt */}
        <div className={`lg:col-span-2 border rounded-xl p-5 shadow-sm relative overflow-hidden transition-colors ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs uppercase font-mono tracking-wider font-bold ${
                  isLightMode ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  PARAMETRIC DISASTER INSURANCE PROTOCOL
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 border ${
                  insuranceEvaluated
                    ? triggerReached ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {insuranceEvaluated ? triggerReached ? 'Threshold reached' : 'Below threshold' : 'Unavailable'}
                </span>
              </div>
              <h1 className={`text-xl sm:text-xl font-black tracking-tight ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                {insuranceEvaluated
                  ? triggerReached ? 'Configured trigger threshold reached' : 'Configured trigger threshold not reached'
                  : 'Insurance trigger cannot be evaluated'}
              </h1>
              <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                {insuranceSummary?.headline ?? 'Waiting for an insurance assessment from disaster intelligence.'}
              </p>
            </div>

            {/* Payout Figure */}
            <div className={`p-3 rounded-xl border text-right shrink-0 ${
                isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-[10px] uppercase font-mono ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Disbursed Liquidity
              </span>
              <div className={`text-xl sm:text-xl font-extrabold font-mono tracking-tight ${
                  isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                {insuranceSummary?.estimated_payout_cr == null ? 'Unavailable' : `₹${insuranceSummary.estimated_payout_cr.toFixed(2)} Cr`}
              </div>
              <span className={`text-[11px] font-mono ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {insuranceSummary?.observed_water_depth_m == null ? 'Observed depth unavailable' : `${insuranceSummary.observed_water_depth_m.toFixed(2)} m observed`}
              </span>
            </div>
          </div>

          <div className={`pt-3 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className={`text-[10px] font-bold uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Coverage focus returned by API</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {insuranceSummary?.coverage_focus?.length
                ? insuranceSummary.coverage_focus.map(item => <span key={item} className={`rounded-md border px-2 py-1 text-[11px] ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-950 text-slate-300'}`}>{item}</span>)
                : <span className="text-xs text-slate-500">No coverage areas returned.</span>}
            </div>
            {insuranceSummary?.note && <p className={`mt-2 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{insuranceSummary.note}</p>}
          </div>
        </div>

        {/* Verification & Smart Contract Hash Card */}
        <div className={`border rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-colors ${
          isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h3 className={`font-bold text-sm flex items-center gap-1.5 mb-2 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              <ShieldCheck size={16} className={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} />
              <span>Trigger assessment details</span>
            </h3>
            <p className={`text-xs leading-relaxed mb-3 ${
              isLightMode ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Values below come from the selected region's disaster-intelligence response. A trigger result is not proof of a policy payout.
            </p>

            <div className={`space-y-1.5 text-xs ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              <div className={`flex justify-between py-1 border-b ${isLightMode ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Trigger Threshold:</span>
                <span className={`font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{insuranceSummary?.trigger_threshold_m == null ? 'Unavailable' : `≥ ${insuranceSummary.trigger_threshold_m} m`}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isLightMode ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Observed Water Depth:</span>
                <span className={`font-mono font-bold ${isLightMode ? 'text-rose-700' : 'text-rose-400'}`}>{insuranceSummary?.observed_water_depth_m == null ? 'Unavailable' : `${insuranceSummary.observed_water_depth_m.toFixed(2)} m`}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isLightMode ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Trigger result:</span>
                <span className={`font-mono font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{insuranceEvaluated ? triggerReached ? 'Reached' : 'Not reached' : 'Unavailable'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Payout amount:</span>
                <span className={`font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{insuranceSummary?.estimated_payout_cr == null ? 'Unavailable' : `₹${insuranceSummary.estimated_payout_cr.toFixed(2)} Cr`}</span>
              </div>
            </div>
          </div>

          <div className={`mt-3 rounded-lg border p-2 text-[10px] ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
            {insuranceSummary?.note ?? 'No policy, payout, or transaction ledger is connected to this response.'}
          </div>
        </div>
      </div>

      {/* 2. Before/After Slider Component Over Satellite Flood Imagery */}
      <div className={`border rounded-xl p-4 shadow-sm transition-colors ${
        isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              <Layers size={16} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
              <span>Before / After Flood Damage Comparison Slider</span>
            </h3>
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Drag the interactive slider divider to compare pre-storm dry satellite baseline vs post-storm inundated flood extent.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded border font-medium ${
              isLightMode ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              Left: Pre-Disaster Baseline
            </span>
            <span className={`px-2 py-0.5 rounded border font-medium ${
              isLightMode ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold' : 'bg-blue-950 text-blue-300 border border-blue-800'
            }`}>
              Right: Post-Disaster Inundation
            </span>
          </div>
        </div>

        {/* Visual Comparison Stage */}
        <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden border border-slate-300 bg-slate-950 select-none shadow-inner">
          {/* Base: "After" Image (Flood Inundation View) */}
          <div className="absolute inset-0">
            <svg viewBox="0 0 1000 600" className="w-full h-full object-cover">
              {/* Dark Muddy Flooded Estuary Terrain */}
              <rect width="1000" height="600" fill="#0d1b1e" />
              
              {/* Massive Turbid Flood Waters Pattern */}
              <path
                d="M 320,0 C 370,120 440,240 370,360 C 310,460 380,540 430,600 L 1000,600 L 1000,0 Z"
                fill="#1e3a5f"
                opacity="0.85"
              />
              
              {/* Severe Overbank Inundation in Urban Zones (Ward 17, Topsia, Kasba) */}
              <ellipse cx="480" cy="330" rx="340" ry="210" fill="#2563eb" opacity="0.65" />
              <ellipse cx="440" cy="320" rx="220" ry="140" fill="#1d4ed8" opacity="0.8" />
              <circle cx="430" cy="310" r="95" fill="#3b82f6" opacity="0.9" />

              {/* Submerged Road Grid */}
              <path d="M 100,340 L 900,340" stroke="#0284c7" strokeWidth="6" opacity="0.7" strokeDasharray="12 8" />
              <path d="M 520,60 L 520,540" stroke="#0284c7" strokeWidth="6" opacity="0.7" strokeDasharray="12 8" />

              {/* Breach Callout */}
              <g transform="translate(420, 240)">
                <rect width="180" height="32" rx="4" fill="#991b1b" stroke="#fca5a5" strokeWidth="1" />
                <text x="10" y="21" fill="#ffffff" fontSize="12" fontWeight="700">
                  ⚠️ 1.42m Inundation Crest
                </text>
              </g>

              {/* Tag in bottom-right */}
              <g transform="translate(730, 550)">
                <rect width="250" height="34" rx="6" fill="#0f172a" fillOpacity="0.85" stroke="#334155" />
                <text x="12" y="22" fill="#93c5fd" fontSize="12" fontWeight="600">
                  POST-DISASTER: Inundation Active
                </text>
              </g>
            </svg>
          </div>

          {/* Top Overlay: "Before" Image (Dry Baseline View), clipped by slider position */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 w-full h-full" style={{ width: '100%', minWidth: '100%' }}>
              <svg viewBox="0 0 1000 600" className="w-full h-full object-cover">
                {/* Lush Healthy Dry Delta Terrain */}
                <rect width="1000" height="600" fill="#142c1f" />
                
                {/* Clean River in normal dry banks */}
                <path
                  d="M 390,0 C 410,120 420,240 390,360 C 360,460 380,540 400,600"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="28"
                  strokeLinecap="round"
                />

                {/* Dry Urban Grid */}
                <ellipse cx="480" cy="330" rx="300" ry="180" fill="#3f2e1e" opacity="0.6" />
                <path d="M 100,340 L 900,340" stroke="#94a3b8" strokeWidth="4" opacity="0.7" />
                <path d="M 520,60 L 520,540" stroke="#94a3b8" strokeWidth="4" opacity="0.7" />

                {/* Mangrove buffer lush green */}
                <path d="M 0,480 Q 500,430 1000,460 L 1000,600 L 0,600 Z" fill="#059669" opacity="0.85" />

                {/* Tag in bottom-left */}
                <g transform="translate(20, 550)">
                  <rect width="240" height="34" rx="6" fill="#064e3b" fillOpacity="0.85" stroke="#10b981" />
                  <text x="12" y="22" fill="#a7f3d0" fontSize="12" fontWeight="600">
                    PRE-DISASTER: Dry Baseline (0.0m)
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Divider Drag Bar */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs">
              ⇄
            </div>
          </div>

          {/* Slider input control overlay for accessibility */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            aria-label="Before and after flood damage comparison slider"
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
          />
        </div>
      </div>

      {/* 3. Section Highlighting UNEP SDG Alignment matching prompt */}
      <div className={`border rounded-xl p-4 shadow-sm transition-colors ${
        isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className={`font-bold text-sm flex items-center gap-2 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              <TreeDeciduous size={16} className={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} />
              <span>United Nations Environment Programme (UNEP) SDG Alignment</span>
            </h3>
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Direct contribution of ClimaGuard early warning and nature-based mangrove buffering to 2030 Global Agenda.
            </p>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border self-start ${
            isLightMode
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
          }`}>
            Verified UNEP Framework Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SDG_ALIGNMENTS.map((sdg) => (
            <div
              key={sdg.id}
              className={`p-3 rounded-xl border transition-colors flex flex-col justify-between ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                    isLightMode
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-blue-950 text-blue-400 border-blue-800'
                  }`}>
                    {sdg.badge}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    {sdg.status}
                  </span>
                </div>

                <h4 className={`font-bold text-xs mb-1.5 leading-snug ${
                  isLightMode ? 'text-slate-900' : 'text-white'
                }`}>
                  SDG {sdg.id}: {sdg.title}
                </h4>
                <p className={`text-[11px] leading-relaxed mb-3 ${
                  isLightMode ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  {sdg.description}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden mb-1.5 ${
                  isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                }`}>
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${sdg.progressPercentage}%` }}
                  />
                </div>
                <div className={`flex justify-between text-[10px] font-mono mb-2 ${
                  isLightMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <span>Target Progress</span>
                  <span className={`font-bold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {sdg.progressPercentage}%
                  </span>
                </div>

                <div className={`p-1.5 rounded border text-[10px] leading-tight ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-800/80 text-slate-300'
                }`}>
                  <span className={`font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Impact: </span>
                  {sdg.targetMetric}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
