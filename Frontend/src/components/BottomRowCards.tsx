import React from 'react';
import { Home, Info, Plus } from 'lucide-react';
import { InfrastructureResponse } from '../api';

interface BottomRowCardsProps {
  infrastructure: InfrastructureResponse | null;
  isLightMode?: boolean;
}

export const BottomRowCards: React.FC<BottomRowCardsProps> = ({
  infrastructure,
  isLightMode = true,
}) => {
  const cardClass = isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textClass = isLightMode ? 'text-slate-900' : 'text-slate-100';
  const mutedClass = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const facilities = infrastructure ? [...infrastructure.shelters, ...infrastructure.hospitals] : [];

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">

      {/* Card 1: Nearby Facilities */}
      <section className={`border rounded-2xl p-5 shadow-sm flex flex-col ${cardClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-emerald-600" />
          <h3 className={`font-bold text-base ${textClass}`}>Nearby Facilities</h3>
        </div>
        
        <div className="flex-1">
          {!infrastructure ? (
            <p className={`text-sm ${mutedClass}`}>Facility data is unavailable.</p>
          ) : facilities.length === 0 ? (
            <div className="space-y-1">
              <p className={`text-sm ${mutedClass}`}>No facilities returned for this region.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              {infrastructure.shelters.slice(0, 3).map((facility, index) => (
                <div key={`shelter-${index}`} className={`p-3 rounded-xl border transition-colors ${isLightMode ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-900 border-slate-800'}`}>
                  <div className={`flex items-start gap-2.5 font-semibold text-sm ${textClass}`}>
                    <Home size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div>{facility.name}</div>
                      <div className={`mt-1 text-xs font-normal leading-relaxed ${mutedClass}`}>
                        {facility.address || 'Address not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {infrastructure.hospitals.slice(0, 3).map((facility, index) => (
                <div key={`hospital-${index}`} className={`p-3 rounded-xl border transition-colors ${isLightMode ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-900 border-slate-800'}`}>
                  <div className={`flex items-start gap-2.5 font-semibold text-sm ${textClass}`}>
                    <Plus size={16} className="text-rose-600 mt-0.5 shrink-0" strokeWidth={3} />
                    <div>
                      <div>{facility.name}</div>
                      <div className={`mt-1 text-xs font-normal leading-relaxed ${mutedClass}`}>
                        {facility.address || 'Address not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {infrastructure && facilities.length > 0 && (
          <div className={`text-xs mt-4 pt-3 border-t font-medium ${isLightMode ? 'border-slate-100' : 'border-slate-800'} ${mutedClass}`}>
            Showing {Math.min(infrastructure.shelters.length, 3)} of {infrastructure.shelters.length} shelters · {Math.min(infrastructure.hospitals.length, 3)} of {infrastructure.hospitals.length} hospitals
          </div>
        )}
      </section>

      {/* Card 2: Evacuation Routes */}
      <section className={`border rounded-2xl p-5 shadow-sm flex flex-col ${cardClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-amber-600" />
          <h3 className={`font-bold text-base ${textClass}`}>Evacuation Routes</h3>
        </div>
        
        <div className={`flex-1 rounded-xl border border-dashed flex items-center justify-center p-8 text-center ${isLightMode ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/50 border-slate-700'}`}>
          <p className={`text-sm leading-relaxed max-w-[220px] ${mutedClass}`}>
            Route data is not currently exposed by the backend API. No route status or safety recommendation is shown.
          </p>
        </div>
      </section>
      
    </div>
  );
};
