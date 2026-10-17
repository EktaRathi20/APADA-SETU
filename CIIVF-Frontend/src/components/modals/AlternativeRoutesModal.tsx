import React from 'react';
import { X, Bus, CheckCircle2, AlertTriangle, Navigation, Shield } from 'lucide-react';
import { EVACUATION_ROUTES } from '../../data/mockData';

interface AlternativeRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
}

export const AlternativeRoutesModal: React.FC<AlternativeRoutesModalProps> = ({
  isOpen,
  onClose,
  isLightMode = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transition-colors animate-in fade-in zoom-in-95 duration-200 ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
              isLightMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            }`}>
              <Navigation size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Evacuation Corridors & Alternate Routes
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Live Traffic & Inundation Status
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

        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {EVACUATION_ROUTES.map((route) => (
            <div
              key={route.id}
              className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`font-bold text-sm flex items-center gap-2 ${
                  isLightMode ? 'text-slate-900' : 'text-white'
                }`}>
                  <Bus size={15} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
                  <span>{route.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  route.riskStatus === 'Safe' 
                    ? (isLightMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-800')
                    : route.riskStatus === 'Moderate'
                    ? (isLightMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-800')
                    : (isLightMode ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950 text-rose-300 border border-rose-800')
                }`}>
                  {route.riskStatus}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <div>Distance: <span className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{route.distance}</span></div>
                <div>Transit Time: <span className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{route.estimatedTime}</span></div>
              </div>

              <p className={`p-2 rounded-lg border text-xs leading-relaxed ${
                isLightMode ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}>
                {route.details}
              </p>
            </div>
          ))}
        </div>

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
            Close Route Guide
          </button>
        </div>
      </div>
    </div>
  );
};
