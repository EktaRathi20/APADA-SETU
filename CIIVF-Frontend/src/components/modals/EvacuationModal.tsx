import React, { useState } from 'react';
import { 
  AlertTriangle, Send, X, CheckCircle2, 
  Radio, Volume2, ShieldCheck, MapPin, Users, Check
} from 'lucide-react';

interface EvacuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
}

export const EvacuationModal: React.FC<EvacuationModalProps> = ({
  isOpen,
  onClose,
  isLightMode = true,
}) => {
  const [selectedWard, setSelectedWard] = useState('Ward 17');
  const [enableSiren, setEnableSiren] = useState(true);
  const [enableSms, setEnableSms] = useState(true);
  const [enableLoudspeakers, setEnableLoudspeakers] = useState(true);
  const [isDispatched, setIsDispatched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDispatched(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transition-colors animate-in fade-in zoom-in-95 duration-200 ${
        isLightMode
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold ${
              isLightMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
            }`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Issue Targeted Evacuation Order
              </h3>
              <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Common Alerting Protocol (CAP) Integration
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
        <div className="p-5 space-y-4">
          {!isDispatched ? (
            <>
              {/* Target Ward selection */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Target Municipal Ward / Sector
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['Ward 17 (Critical)', 'Ward 24 (Riverbank)', 'Ward 58 (Topsia)'].map((ward) => (
                    <button
                      key={ward}
                      type="button"
                      onClick={() => setSelectedWard(ward)}
                      className={`p-2 rounded-lg border text-center transition-colors font-medium cursor-pointer ${
                        selectedWard === ward
                          ? (isLightMode ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' : 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold')
                          : (isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800')
                      }`}
                    >
                      {ward}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Impact Box */}
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex justify-between">
                  <span className={`flex items-center gap-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Users size={14} className={isLightMode ? 'text-blue-600' : 'text-blue-400'} />
                    Target Evacuation Population:
                  </span>
                  <span className={`font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    42,500 Residents
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`flex items-center gap-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin size={14} className={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} />
                    Designated Receiving Shelters:
                  </span>
                  <span className={`font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    Shelter 1 & Shelter 2
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`flex items-center gap-1.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Radio size={14} className={isLightMode ? 'text-blue-600' : 'text-cyan-400'} />
                    Designated Safe Route:
                  </span>
                  <span className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    EM Bypass Logistics Corridor
                  </span>
                </div>
              </div>

              {/* Alert Broadcast Channels */}
              <div>
                <div className={`text-xs font-semibold mb-2 ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Broadcast Alert Channels
                </div>
                <div className="space-y-2 text-xs">
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    isLightMode ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className={isLightMode ? 'text-amber-600' : 'text-amber-400'} />
                      <div>
                        <div className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          Cell Broadcast Siren (WEA)
                        </div>
                        <div className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          High-pitch audible alarm to all mobile devices in geofence
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSiren}
                      onChange={(e) => setEnableSiren(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${
                    isLightMode ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/70' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Radio size={16} className={isLightMode ? 'text-emerald-600' : 'text-emerald-400'} />
                      <div>
                        <div className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          Automated SMS Blast
                        </div>
                        <div className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          Bengali, Hindi, and English multi-lingual evacuation notices
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSms}
                      onChange={(e) => setEnableSms(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className={`w-14 h-14 rounded-full border mx-auto flex items-center justify-center ${
                isLightMode ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              }`}>
                <CheckCircle2 size={32} />
              </div>
              <h4 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Evacuation Order Successfully Dispatched!
              </h4>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                Cellular sirens triggered for geofenced {selectedWard}. Police loudspeaker units mobilized to EM Bypass corridor.
              </p>
              <div className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                CAP Protocol Token: #EVAC-WB-2026-0924-W17
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className={`px-5 py-3 border-t flex justify-end gap-2.5 ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {!isDispatched ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 font-medium rounded-xl text-xs transition-colors cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDispatch}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Broadcasting Sirens...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Authorize Evacuation</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
