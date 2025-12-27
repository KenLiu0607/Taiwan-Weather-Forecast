
import { API_BASE_URL, API_KEY, DATA_ID_36H, DATA_ID_WEEKLY, LOCATION_ORDER } from '../constants';
import { CWAResponse, FormattedLocation, FormattedWeatherTime, CWALocation, WeeklyApiResponse, DailyForecast, DayPartForecast } from '../types';

export const fetchWeatherForecast = async (): Promise<FormattedLocation[]> => {
  try {
    const url = `${API_BASE_URL}/${DATA_ID_36H}?Authorization=${API_KEY}&format=JSON&sort=time`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching weather data: ${response.statusText}`);
    }

    const data: CWAResponse = await response.json();
    
    if (data.success !== "true") {
      throw new Error("API returned unsuccessful status");
    }

    return formatWeatherData(data.records.location);
  } catch (error) {
    console.error("Weather fetch failed:", error);
    throw error;
  }
};

const formatWeatherData = (locations: CWALocation[]): FormattedLocation[] => {
  const formatted = locations.map((location) => {
    // We expect 3 time periods (12h each) for 36h forecast
    const periods = 3;
    const forecasts: FormattedWeatherTime[] = [];

    // Extract elements
    const wx = location.weatherElement.find(e => e.elementName === "Wx");
    const pop = location.weatherElement.find(e => e.elementName === "PoP");
    const minT = location.weatherElement.find(e => e.elementName === "MinT");
    const maxT = location.weatherElement.find(e => e.elementName === "MaxT");
    const ci = location.weatherElement.find(e => e.elementName === "CI");

    if (!wx || !pop || !minT || !maxT || !ci) {
        return { locationName: location.locationName, forecasts: [] };
    }

    for (let i = 0; i < periods; i++) {
        // Ensure data exists for this period
        if (wx.time[i] && pop.time[i] && minT.time[i] && maxT.time[i] && ci.time[i]) {
            forecasts.push({
                startTime: wx.time[i].startTime,
                endTime: wx.time[i].endTime,
                wx: wx.time[i].parameter.parameterName,
                wxValue: parseInt(wx.time[i].parameter.parameterValue || "0", 10),
                pop: pop.time[i].parameter.parameterName,
                minT: minT.time[i].parameter.parameterName,
                maxT: maxT.time[i].parameter.parameterName,
                ci: ci.time[i].parameter.parameterName,
            });
        }
    }

    return {
      locationName: location.locationName,
      forecasts,
    };
  });

  // Sort locations based on the defined order
  return formatted.sort((a, b) => {
    let indexA = LOCATION_ORDER.indexOf(a.locationName);
    let indexB = LOCATION_ORDER.indexOf(b.locationName);
    
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    
    return indexA - indexB;
  });
};

// --- Weekly Forecast Logic ---

// Now fetches ALL locations and returns a map
export const fetchAllWeeklyForecast = async (): Promise<Record<string, DailyForecast[]>> => {
  try {
    const url = `${API_BASE_URL}/${DATA_ID_WEEKLY}?Authorization=${API_KEY}&format=JSON`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weekly fetch failed");
    
    const data: WeeklyApiResponse = await response.json();
    const locations = data.records.Locations[0].Location;

    const resultMap: Record<string, DailyForecast[]> = {};

    locations.forEach(location => {
        resultMap[location.LocationName] = parseWeeklyData(location);
    });

    return resultMap;

  } catch (error) {
    console.error("Error fetching weekly forecast:", error);
    return {};
  }
};

const parseWeeklyData = (location: any): DailyForecast[] => {
    const dailyMap = new Map<string, DailyForecast>();

    // Helper to get element data
    const getElement = (name: string) => location.WeatherElement.find((e: any) => e.ElementName === name);

    const wxData = getElement("天氣現象")?.Time || [];
    const maxTData = getElement("最高溫度")?.Time || [];
    const minTData = getElement("最低溫度")?.Time || [];
    const popData = getElement("12小時降雨機率")?.Time || [];
    const wsData = getElement("風速")?.Time || [];

    // Iterate through time blocks
    wxData.forEach((block: any) => {
        if (!block || !block.StartTime) return;

        // Use string splitting for robustness against timezone settings
        // block.StartTime format: "YYYY-MM-DDTHH:mm:ss+08:00"
        const timePart = block.StartTime.split('T')[1]; 
        const hourStr = timePart.split(':')[0];
        const hour = parseInt(hourStr, 10);
        
        const dateStr = block.StartTime.split('T')[0];

        // Determine if it's Day (approx 06:00) or Night (approx 18:00)
        // CWA API typically uses 06:00 and 18:00 for 12h intervals
        const isDay = hour >= 6 && hour < 18;
        const type = isDay ? 'day' : 'night';

        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, { date: dateStr });
        }

        const findValue = (source: any[]) => source.find((item: any) => item.StartTime === block.StartTime);

        const maxTItem = findValue(maxTData);
        const minTItem = findValue(minTData);
        const popItem = findValue(popData);
        const wsItem = findValue(wsData);

        // Safe extraction with fallbacks
        const dayPart: DayPartForecast = {
            type,
            startTime: block.StartTime,
            wx: block.ElementValue[0]?.Weather || "未知",
            wxCode: parseInt(block.ElementValue[0]?.WeatherCode || "0", 10),
            temp: 0,
            pop: "0",
            windLevel: "-"
        };

        if (isDay) {
             dayPart.temp = parseInt(maxTItem?.ElementValue[0]?.MaxTemperature || "25", 10);
        } else {
             dayPart.temp = parseInt(minTItem?.ElementValue[0]?.MinTemperature || "20", 10);
        }

        // Use safe navigation ?. and fallback to "0"
        const popVal = popItem?.ElementValue[0]?.ProbabilityOfPrecipitation;
        dayPart.pop = (popVal === " " || popVal === "-") ? "0" : (popVal || "0");
        
        dayPart.windLevel = wsItem?.ElementValue[0]?.BeaufortScale || "-";

        const entry = dailyMap.get(dateStr)!;
        if (isDay) entry.day = dayPart;
        else entry.night = dayPart;
    });

    // Filter and Sort
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let results = Array.from(dailyMap.values())
        .filter(item => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            // Allow today's data to be shown so we don't lose a day if the API includes today
            return itemDate >= today; 
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fix: Remove incomplete future data (e.g., if the last day only has a Night forecast but no Day)
    if (results.length > 0) {
        const lastItem = results[results.length - 1];
        const lastDate = new Date(lastItem.date);
        lastDate.setHours(0, 0, 0, 0);

        // If it is a future date (not today) and is missing either day or night data, remove it
        if (lastDate.getTime() > today.getTime()) {
            if (!lastItem.day || !lastItem.night) {
                results.pop();
            }
        }
    }

    return results.slice(0, 7); // Ensure we keep up to 7 days
};
