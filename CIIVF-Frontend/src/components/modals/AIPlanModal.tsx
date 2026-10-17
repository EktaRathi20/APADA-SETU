import React from 'react';
import { X, Cpu, CheckCircle2, ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';
import { CityLocation } from '../../types';

interface AIPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityLocation;
  mode: 'why' | 'plan';
  isLightMode?: boolean;
}

export const AIPlanModal: React.FC<AIPlanModalProps> = ({
  isOpen,
  onClose,
  city,
  mode,
  isLightMode = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden transition-colors animate-in fade-in zoom-in-95 duration-200 ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              isLightMode ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
            }`}>
              <Cpu size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {mode === 'why' ? 'AI Analytical Rationale & Provenance' : 'Comprehensive Preparedness Action Plan'}
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Ground Truth Engine · {city.name}, {city.region}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1 cursor-pointer transition-colors ${
              isLightMode ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Summary Box */}
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isLightMode
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className={`font-bold block mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Operational Assessment:
            </span>
            {city.aiPreparednessBrief.summary}
          </div>

          {mode === 'why' ? (
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLightMode ? 'text-cyan-800' : 'text-cyan-300'
              }`}>
                <Database size={14} />
                <span>Multi-Source Satellite & Hydrological Justification</span>
              </h4>
              <div className="space-y-2.5">
                {city.aiPreparednessBrief.rationale.map((point, index) => (
                  <div key={index} className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}>
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{point}</span>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                isLightMode ? 'bg-blue-50/70 border-blue-200 text-slate-700' : 'bg-blue-950/40 border-blue-800/60'
              }`}>
                <div className={`font-bold ${isLightMode ? 'text-blue-900' : 'text-blue-300'}`}>
                  Verified Model Confidence: 94.2%
                </div>
                <p className={`text-[11px] ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Ensemble combining ECMWF high-resolution meteorological models, Indian Meteorological Department (IMD) radar feeds, and municipal water level IoT transducers.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLightMode ? 'text-blue-800' : 'text-blue-300'
              }`}>
                <ShieldCheck size={14} />
                <span>Operational Action Protocols</span>
              </h4>
              <div className="space-y-2.5">
                {city.aiPreparednessBrief.detailedPlan.map((step, index) => (
                  <div key={index} className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}>
                    <span className={`w-5 h-5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 border ${
                      isLightMode ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-600/30 text-blue-400 border-blue-500/40'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex justify-end ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 font-medium rounded-xl text-xs transition-colors cursor-pointer shadow-xs ${
              isLightMode
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
