import React, { useState } from 'react';
import { 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Compass, 
  Thermometer, 
  X, 
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { WEATHER_FORECAST_DAYS } from '../../data/mockData';

interface SevenDayForecastPanelProps {
  region?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const SevenDayForecastPanel: React.FC<SevenDayForecastPanelProps> = ({
  region = 'Visakhapatnam & Coastal Belt',
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Fallback / expanded 7-day forecast days
  const forecastDays = WEATHER_FORECAST_DAYS && WEATHER_FORECAST_DAYS.length >= 7 
    ? WEATHER_FORECAST_DAYS 
    : [
        { day: 'Today', date: '24 Sep', high: 33, low: 27, rainProb: 75, condition: 'rain-heavy', temp: 30, rainfallMm: 42 },
        { day: 'Wed', date: '25 Sep', high: 32, low: 26, rainProb: 90, condition: 'storm', temp: 28, rainfallMm: 85 },
        { day: 'Thu', date: '26 Sep', high: 30, low: 25, rainProb: 95, condition: 'cyclone', temp: 27, rainfallMm: 140 },
        { day: 'Fri', date: '27 Sep', high: 29, low: 24, rainProb: 65, condition: 'rain', temp: 28, rainfallMm: 35 },
        { day: 'Sat', date: '28 Sep', high: 31, low: 25, rainProb: 40, condition: 'partly-cloudy', temp: 29, rainfallMm: 12 },
        { day: 'Sun', date: '29 Sep', high: 33, low: 26, rainProb: 20, condition: 'cloudy', temp: 31, rainfallMm: 4 },
        { day: 'Mon', date: '30 Sep', high: 34, low: 27, rainProb: 15, condition: 'sunny', temp: 32, rainfallMm: 0 },
      ];

  const selectedDay = forecastDays[selectedDayIndex] || forecastDays[0];

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'rain-heavy':
      case 'storm':
      case 'cyclone':
        return <CloudLightning className="w-5 h-5 text-amber-500" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-500" />;
      default:
        return <CloudRain className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-2xl flex flex-col text-slate-900 ${isEmbedded ? '' : 'p-6 max-h-[85vh] overflow-y-auto'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              7-Day Predictive Weather & Synoptic Forecast
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                IMD Synoptic Ingest
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Region: <span className="font-semibold text-slate-700 capitalize">{region}</span> · High-resolution numerical weather prediction (NWP)
            </p>
          </div>
        </div>

        {onClose && !isEmbedded && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Grid: Days Strip */}
      <div className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {forecastDays.map((item, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{item.day}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                </div>

                <div className="my-2.5 flex items-center justify-between">
                  {getConditionIcon(item.condition)}
                  <span className="text-sm font-bold text-slate-900 font-mono">{item.temp}°C</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 text-blue-500" />
                    {item.rainProb}%
                  </span>
                  <span className="text-slate-600 font-mono font-medium">
                    {item.rainfallMm}mm
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day In-Depth Synopsis */}
      <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Synoptic Detail: {selectedDay.day} ({selectedDay.date})
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              selectedDay.rainProb > 70 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {selectedDay.rainProb > 70 ? 'High Precipitation Risk' : 'Standard Baseline'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Updated from Doppler RADAR at 06:00 UTC
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              Temp Range
            </span>
            <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">
              {selectedDay.low}°C – {selectedDay.high}°C
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Accumulated Rain
            </span>
            <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">
              {selectedDay.rainfallMm} mm / 24h
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-teal-500" />
              Max Gust Velocity
            </span>
            <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">
              {selectedDay.rainProb > 70 ? '65–85 km/h' : '18–25 km/h'}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              Est. Barometer
            </span>
            <span className="text-sm font-mono font-bold text-slate-800 mt-1 block">
              {selectedDay.rainProb > 70 ? '998.4 hPa' : '1012.8 hPa'}
            </span>
          </div>
        </div>

        {/* Advisory alert note */}
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">IMD Regional Advisory Note:</span> In the event of a cyclonic depression forming in east-central Bay of Bengal, 72-hour forecast models will automatically trigger Amber Mode countdown sequence.
          </div>
        </div>
      </div>
    </div>
  );
};
