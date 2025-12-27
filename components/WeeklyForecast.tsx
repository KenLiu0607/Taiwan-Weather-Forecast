
import React from 'react';
import { DailyForecast } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { Droplets, Wind } from 'lucide-react';

interface WeeklyForecastProps {
  data: DailyForecast[];
  locationName?: string;
}

const DayColumn: React.FC<{ dayData: DailyForecast }> = ({ dayData }) => {
  const date = new Date(dayData.date);
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
  const dayOfWeek = date.toLocaleDateString('zh-TW', { weekday: 'short' });

  // Styling helper
  const Slot = ({ part }: { part?: any }) => {
    // If data is missing (e.g. past time or API gap), show a subtle placeholder
    if (!part) return (
        <div className="flex-1 bg-white/5 rounded-xl m-1 flex items-center justify-center">
             <span className="text-white/30 text-xs">-</span>
        </div>
    );
    
    const isHot = part.temp >= 28;
    const bgClass = part.type === 'day' 
        ? (isHot ? 'bg-orange-100/80' : 'bg-blue-100/80')
        : 'bg-slate-800/80';
    
    const textClass = part.type === 'day' ? 'text-slate-700' : 'text-slate-200';

    return (
      <div className={`flex flex-col items-center justify-center p-2 rounded-xl m-1 backdrop-blur-sm transition-all hover:scale-105 ${bgClass}`}>
        <span className={`text-[10px] font-bold mb-1 opacity-70 ${textClass}`}>
          {part.type === 'day' ? '06-18' : '18-06'}
        </span>
        <WeatherIcon wxValue={part.wxCode} className="w-8 h-8 mb-1" />
        <span className={`text-lg font-bold ${textClass}`}>{part.temp}°</span>
        
        <div className="flex gap-2 mt-1">
           <div className="flex items-center text-[10px] opacity-80">
             <Droplets className={`w-3 h-3 mr-0.5 ${part.type === 'day' ? 'text-blue-500' : 'text-blue-300'}`} />
             <span className={textClass}>{part.pop}%</span>
           </div>
           <div className="flex items-center text-[10px] opacity-80">
             <Wind className={`w-3 h-3 mr-0.5 ${textClass}`} />
             <span className={textClass}>{part.windLevel}級</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-w-[120px] snap-start">
      {/* Date Header */}
      <div className="text-center mb-2">
        <div className="text-white font-bold text-lg shadow-black drop-shadow-md">{dateLabel}</div>
        <div className="text-white/80 text-xs font-medium">{dayOfWeek}</div>
      </div>
      
      {/* Slots */}
      <div className="flex flex-col gap-1 flex-grow">
        <Slot part={dayData.day} />
        <Slot part={dayData.night} />
      </div>
    </div>
  );
};

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ data, locationName }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 px-4 z-20 relative">
      <h2 className="text-white text-xl font-bold mb-4 flex items-center drop-shadow-lg">
        <span className="bg-white/20 p-1 rounded-md mr-2 backdrop-blur-sm">📅</span>
        {locationName ? `${locationName}未來一週天氣預報` : '未來一週天氣預報'}
      </h2>
      
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 shadow-2xl overflow-hidden">
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar snap-x">
          {data.map((day) => (
            <DayColumn key={day.date} dayData={day} />
          ))}
        </div>
      </div>
    </div>
  );
};
