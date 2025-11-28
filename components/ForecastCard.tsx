import React from 'react';
import { FormattedLocation, FormattedWeatherTime } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { Droplets, Thermometer, MapPin } from 'lucide-react';

interface ForecastCardProps {
  data: FormattedLocation;
}

const getPeriodLabel = (startTime: string): string => {
  const date = new Date(startTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  const hours = date.getHours();
  const isNight = hours >= 18 || hours < 6;

  if (diffDays === 0) {
      return isNight ? "今晚明晨" : "今日白天";
  } else if (diffDays === 1) {
      return isNight ? "明晚後晨" : "明日白天";
  } else if (diffDays === 2) {
      return isNight ? "後天晚上" : "後天白天";
  } else {
      return `${date.getMonth() + 1}/${date.getDate()} ${isNight ? "晚上" : "白天"}`;
  }
};

const TimePeriodColumn: React.FC<{ forecast: FormattedWeatherTime; themeColor: string }> = ({ forecast, themeColor }) => {
  return (
    <div className={`flex flex-col items-center flex-1 p-2 rounded-xl transition-colors duration-300 ${themeColor === 'hot' ? 'hover:bg-orange-50' : 'hover:bg-blue-50'}`}>
      <span className="text-xs font-semibold text-slate-400 mb-2">{getPeriodLabel(forecast.startTime)}</span>
      
      <div className="mb-2 transform transition-transform duration-300 hover:scale-110">
        <WeatherIcon wxValue={forecast.wxValue} className="w-12 h-12" />
      </div>
      
      <div className="flex flex-col items-center mb-1">
         <span className="text-slate-800 font-bold text-xl leading-none">{forecast.maxT}°</span>
         <span className="text-slate-400 text-xs mt-1">{forecast.minT}°</span>
      </div>

      <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${themeColor === 'hot' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
        <Droplets className="w-3 h-3 mr-1" />
        {forecast.pop}%
      </div>
      
      <p className="text-xs text-slate-500 text-center mt-2 font-medium line-clamp-1 w-full overflow-hidden text-ellipsis">
        {forecast.wx}
      </p>
    </div>
  );
};

export const ForecastCard: React.FC<ForecastCardProps> = ({ data }) => {
  const firstMaxT = parseInt(data.forecasts[0]?.maxT || "25", 10);
  const isHot = firstMaxT > 28;
  const themeColor = isHot ? 'hot' : 'cold';

  // Card Styling: Opaque white background to stand out from complex background
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col border border-white/40">
      
      {/* Header */}
      <div className={`px-5 py-3 flex justify-between items-center bg-gradient-to-r ${isHot ? 'from-orange-50 to-amber-50' : 'from-blue-50 to-indigo-50'} border-b border-slate-100`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isHot ? 'bg-orange-200 text-orange-700' : 'bg-blue-200 text-blue-700'}`}>
             <MapPin className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">{data.locationName}</h3>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold shadow-sm ${isHot ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
           <Thermometer className="w-3 h-3" />
           {firstMaxT}°C
        </div>
      </div>
      
      {/* Content */}
      <div className="flex divide-x divide-slate-100 p-2 flex-grow items-stretch">
        {data.forecasts.slice(0, 3).map((forecast, idx) => (
          <TimePeriodColumn 
            key={`${data.locationName}-${idx}`} 
            forecast={forecast}
            themeColor={themeColor}
          />
        ))}
      </div>
    </div>
  );
};