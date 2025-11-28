import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSun, CloudDrizzle, Snowflake } from 'lucide-react';

interface WeatherIconProps {
  wxValue: number;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ wxValue, className = "w-6 h-6" }) => {
  // Simplified logic based on CWA codes
  // 1: Sunny
  // 2-3: Partly Cloudy
  // 4-7: Cloudy
  // 8-14: Rain/Showers
  // 15-18: Thunderstorm
  // 19-22: Rain/Thunder
  // 23-42: Fog/Mist/Rain variants (We map generally)

  let Icon = Cloud;
  let colorClass = "text-gray-500";

  if (wxValue === 1) {
    Icon = Sun;
    colorClass = "text-yellow-500";
  } else if (wxValue >= 2 && wxValue <= 3) {
    Icon = CloudSun;
    colorClass = "text-orange-400";
  } else if (wxValue >= 4 && wxValue <= 7) {
    Icon = Cloud;
    colorClass = "text-gray-500";
  } else if (wxValue >= 8 && wxValue <= 14) {
    Icon = CloudRain;
    colorClass = "text-blue-500";
  } else if (wxValue >= 15 && wxValue <= 18) {
    Icon = CloudLightning;
    colorClass = "text-purple-500";
  } else if (wxValue >= 19) {
    Icon = CloudDrizzle;
    colorClass = "text-blue-400";
  }

  return <Icon className={`${className} ${colorClass}`} />;
};