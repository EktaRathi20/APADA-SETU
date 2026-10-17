import React, { useState } from 'react';
import { CloudRain, CloudLightning, Sun, Cloud, ArrowRight } from 'lucide-react';
import { ForecastDayResponse } from '../api';

interface WeatherHazardChartProps {
  forecast: ForecastDayResponse[];
  isLightMode?: boolean;
}

export const WeatherHazardChart: React.FC<WeatherHazardChartProps> = ({
  forecast,
  isLightMode = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const cardBg = isLightMode
    ? 'bg-white border border-slate-200/90 shadow-xs'
    : 'bg-slate-900/90 border border-slate-800 shadow-sm';
  const headingText = isLightMode ? 'text-slate-900' : 'text-slate-100';
  const labelText = isLightMode ? 'text-slate-500' : 'text-slate-400';

  const getWeatherIcon = (condition: string) => {
    const normalized = condition.toLowerCase();
    if (normalized.includes('storm') || normalized.includes('thunder')) return <CloudLightning size={18} className="text-amber-500" />;
    if (normalized.includes('rain') || normalized.includes('shower')) return <CloudRain size={18} className="text-blue-500" />;
    if (normalized.includes('cloud')) return <Cloud size={18} className="text-slate-400" />;
    return <Sun size={18} className="text-amber-500" />;
  };

  const chartForecast = forecast.slice(0, 7);
  const pointX = (index: number) => chartForecast.length === 1 ? 250 : 55 + index * (360 / (chartForecast.length - 1));
  const pointY = (temperature: number) => 100 - (Math.max(0, Math.min(40, temperature)) / 40) * 90;

  return (
    <div className={`${cardBg} rounded-xl p-3.5 flex flex-col justify-between transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-bold text-sm ${headingText}`}>7-Day Weather Forecast</h3>
      </div>

      {chartForecast.length === 0 ? (
        <p className={`py-8 text-center text-sm ${labelText}`}>Forecast data is unavailable.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-1.5 text-center mb-3 text-xs">
            {chartForecast.map((day, index) => (
              <div
                key={`${day.date}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-1.5 rounded-lg border transition-colors ${hoveredIndex === index ? 'bg-blue-50 border-blue-400' : isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}
              >
                <div className={`text-[11px] font-bold ${headingText}`}>
                  {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className={`text-[10px] mb-1 ${labelText}`}>
                  {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
                <div className="flex justify-center my-1">{getWeatherIcon(day.condition)}</div>
                <div className={`text-[11px] font-bold ${headingText}`}>
                  {Math.round(day.max_temp_c)}° / {Math.round(day.min_temp_c)}°
                </div>
                <div className={`text-[10px] mt-1 truncate ${labelText}`} title={day.condition}>{day.condition}</div>
              </div>
            ))}
          </div>

          <div className={`rounded-lg p-3 ${isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-950/70 border border-slate-800'}`}>
            <div className={`flex justify-end gap-4 text-[10px] mb-2 font-semibold ${labelText}`}>
              <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 bg-orange-500" />Maximum (°C)</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-0.5 bg-cyan-600" />Minimum (°C)</span>
            </div>
            <div className="h-28 w-full">
              <svg viewBox="0 0 500 120" className="w-full h-full">
                {[0, 30, 60, 90].map(y => <line key={y} x1="30" y1={y} x2="470" y2={y} stroke={isLightMode ? '#e2e8f0' : '#334155'} strokeDasharray="4 4" />)}
                {[40, 30, 20, 0].map((value, index) => <text key={value} x="22" y={10 + index * 30} fill={isLightMode ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end">{value}</text>)}
                {(['max_temp_c', 'min_temp_c'] as const).map((temperatureKey, seriesIndex) => {
                  const points = chartForecast.map((day, index) => `${pointX(index)},${pointY(day[temperatureKey])}`).join(' ');
                  return (
                    <g key={temperatureKey}>
                      <polyline points={points} fill="none" stroke={seriesIndex === 0 ? '#f97316' : '#0891b2'} strokeWidth="2.5" />
                      {chartForecast.map((day, index) => <circle key={day.date} cx={pointX(index)} cy={pointY(day[temperatureKey])} r="3" fill={seriesIndex === 0 ? '#f97316' : '#0891b2'} />)}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
