import React from 'react';
import { Building2, CloudRain, Database, Users } from 'lucide-react';
import { CityLocation } from '../types';
import { InfrastructureResponse } from '../api';

interface AssessmentCardsProps {
  city: CityLocation;
  infrastructure: InfrastructureResponse | null;
  isLightMode?: boolean;
}

export const AssessmentCards: React.FC<AssessmentCardsProps> = ({ city, infrastructure, isLightMode = true }) => {
  const cardClass = isLightMode ? 'bg-white border-slate-200/90' : 'bg-slate-900/90 border-slate-800';
  const titleClass = isLightMode ? 'text-slate-900' : 'text-slate-100';
  const mutedClass = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const cards = [
    { title: 'Population', value: city.populationFormatted, detail: 'Population API', icon: Users, color: 'text-blue-600' },
    { title: 'Forecast', value: city.tempRangeAvg, detail: city.forecastSummary, icon: CloudRain, color: 'text-cyan-600' },
    {
      title: 'Nearby facilities',
      value: infrastructure ? `${infrastructure.hospitals.length + infrastructure.shelters.length}` : 'Unavailable',
      detail: infrastructure ? `${infrastructure.hospitals.length} hospitals · ${infrastructure.shelters.length} shelters` : 'Facility API unavailable',
      icon: Building2,
      color: 'text-emerald-600',
    },
    {
      title: 'Warnings and risk',
      value: city.operationalRisk.level,
      detail: city.operationalRisk.level === 'Unavailable'
        ? 'Risk assessment unavailable'
        : `${city.riskScore}/100 screening score · not an official warning`,
      icon: Database,
      color: city.riskLevel === 'Red' ? 'text-rose-600' : city.riskLevel === 'Orange' ? 'text-orange-600' : city.riskLevel === 'Moderate' ? 'text-amber-600' : 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
      {cards.map(({ title, value, detail, icon: Icon, color }) => (
        <section key={title} className={`border rounded-xl p-3.5 min-h-28 flex flex-col justify-between ${cardClass}`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase ${mutedClass}`}>
            <Icon size={15} className={color} /> {title}
          </div>
          <div>
            <div className={`text-lg font-bold ${titleClass}`}>{value}</div>
            <div className={`text-[11px] mt-1 ${mutedClass}`}>{detail}</div>
          </div>
        </section>
      ))}
    </div>
  );
};
